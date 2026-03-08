import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
            return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
        }

        // const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
        const checkoutSession = await stripe.checkout.sessions.retrieve(
  sessionId,
  { expand: ["shipping_details"] }
) as any;

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

        if (userId) {
            await usersCollection.updateOne(
                { _id: new ObjectId(userId) },
                { $set: { isPurchased: true, updatedAt: new Date() } }
            );
            return NextResponse.json({
                success: true,
                session: { shipping_details: checkoutSession.shipping_details }
            });
        }

        if (!email) {
            return NextResponse.json({ success: false, error: "No customer email" }, { status: 400 });
        }

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
            user = await usersCollection.findOne({ _id: insert.insertedId });
        }

        return NextResponse.json({
            success: true,
            session: { shipping_details: checkoutSession.shipping_details },
            email,
            oneTimeToken,
        });
    } catch (error: any) {
        console.error("Payment Check Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
