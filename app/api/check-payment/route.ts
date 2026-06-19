import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { randomBytes } from "crypto";
import {
  upsertOrderFromCheckoutSession,
  markBookAsOrdered,
  sendOrderConfirmationEmailIfNeeded,
} from "@/lib/checkout-fulfillment";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
            return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
        }

        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId) as any;

        if (checkoutSession.payment_status !== "paid") {
            return NextResponse.json({
                success: false,
                status: checkoutSession.status,
                payment_status: checkoutSession.payment_status
            });
        }

        const db = await getDatabase();
        const usersCollection = db.collection("users");
        const userId = checkoutSession.metadata?.userId as string | undefined;
        const email = (checkoutSession.customer_email || (checkoutSession.customer_details as any)?.email) as string | undefined;

        let resolvedUserId: string | null = userId || null;

        if (userId) {
            let query: any;
            if (userId.length === 24) {
                try {
                    query = { _id: new ObjectId(userId) };
                } catch {
                    query = { firebaseUid: userId };
                }
            } else {
                query = { firebaseUid: userId };
            }

            await usersCollection.updateOne(
                query,
                { $set: { isPurchased: true, updatedAt: new Date() } }
            );
        } else if (email) {
            let user = await usersCollection.findOne({ email });
            const oneTimeToken = randomBytes(32).toString("hex");
            const oneTimeTokenExpiry = new Date(Date.now() + 5 * 60 * 1000);

            if (user) {
                await usersCollection.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            isPurchased: true,
                            shippingDetails: checkoutSession.shipping_details ?? undefined,
                            oneTimeToken,
                            oneTimeTokenExpiry,
                            updatedAt: new Date(),
                        },
                    }
                );
                resolvedUserId = user._id.toString();
            } else {
                const insert = await usersCollection.insertOne({
                    email,
                    name: checkoutSession.customer_details?.name ?? email.split("@")[0],
                    provider: "stripe",
                    password: null,
                    image: null,
                    emailVerified: new Date(),
                    isPurchased: true,
                    shippingDetails: checkoutSession.shipping_details ?? undefined,
                    oneTimeToken,
                    oneTimeTokenExpiry,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                resolvedUserId = insert.insertedId.toString();
            }
        } else {
            return NextResponse.json({ success: false, error: "No customer email" }, { status: 400 });
        }

        await upsertOrderFromCheckoutSession(checkoutSession, resolvedUserId);
        await markBookAsOrdered(checkoutSession.metadata?.bookId);
        await sendOrderConfirmationEmailIfNeeded(checkoutSession);

        const response: Record<string, unknown> = {
            success: true,
            session: {
                shipping_details: checkoutSession.shipping_details,
                metadata: checkoutSession.metadata,
            },
        };

        if (!userId && email) {
            const user = await usersCollection.findOne({ email });
            response.email = email;
            response.oneTimeToken = user?.oneTimeToken;
        }

        return NextResponse.json(response);
    } catch (error: any) {
        console.error("Payment Check Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
