import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/lib/mail-service";
import { getRefundEmail } from "@/lib/email-templates";
import {
  upsertOrderFromCheckoutSession,
  markBookAsOrdered,
  sendOrderConfirmationEmailIfNeeded,
  getCustomerEmail,
} from "@/lib/checkout-fulfillment";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`Webhook signature verification failed: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const shippingDetails = session.shipping_details;
        const email = getCustomerEmail(session);

        try {
            const db = await getDatabase();
            const usersCollection = db.collection("users");

            let dbUserId: string | ObjectId | null = null;

            if (userId) {
                try {
                    const userDoc = await usersCollection.findOneAndUpdate(
                        { _id: new ObjectId(userId) },
                        {
                            $set: {
                                isPurchased: true,
                                shippingDetails: shippingDetails ?? undefined,
                                updatedAt: new Date(),
                            },
                        },
                        { returnDocument: "after" }
                    );
                    dbUserId = userDoc ? userDoc._id : userId;
                } catch {
                    dbUserId = userId;
                }
                console.log(`User ${userId} purchase updated via webhook`);
            } else if (email) {
                const existing = await usersCollection.findOne({ email });
                if (existing) {
                    await usersCollection.updateOne(
                        { _id: existing._id },
                        {
                            $set: {
                                isPurchased: true,
                                shippingDetails: shippingDetails ?? undefined,
                                updatedAt: new Date(),
                            },
                        }
                    );
                    dbUserId = existing._id;
                } else {
                    const result = await usersCollection.insertOne({
                        email,
                        name: session.customer_details?.name ?? email.split("@")[0],
                        provider: "stripe",
                        password: null,
                        image: null,
                        emailVerified: new Date(),
                        isPurchased: true,
                        shippingDetails: shippingDetails ?? undefined,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    dbUserId = result.insertedId;
                }
                console.log(`Guest user ${email} created/updated via webhook`);
            }

            await upsertOrderFromCheckoutSession(session, dbUserId);
            await markBookAsOrdered(session.metadata?.bookId);

            const orderType = session.metadata?.orderType || "soft";
            if (orderType === "hard") {
                console.log(
                    `Hard copy order ${session.id} recorded with status 'pending_approval'. Awaiting admin approval.`
                );
            }

            await sendOrderConfirmationEmailIfNeeded(session);
        } catch (error) {
            console.error("Error processing checkout.session.completed:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    }

    if (event.type === "charge.refunded") {
        const charge = event.data.object as any;
        const refunds = charge.refunds?.data || [];
        const latestRefund = refunds[refunds.length - 1];

        if (latestRefund) {
            const orderIdStr = latestRefund.metadata?.orderId;
            const refundAmount = latestRefund.amount;

            if (orderIdStr) {
                try {
                    const db = await getDatabase();
                    const ordersCollection = db.collection("orders");
                    
                    const order = await ordersCollection.findOneAndUpdate(
                        { _id: new ObjectId(orderIdStr) },
                        {
                            $set: {
                                status: "refunded",
                                refundedAt: new Date(),
                                refundId: latestRefund.id,
                            }
                        },
                        { returnDocument: "after" }
                    );

                    if (order && order.email) {
                        await sendEmail({
                            to: order.email,
                            subject: "Your Refund has been Processed",
                            html: getRefundEmail(order.orderId || order._id.toString(), refundAmount / 100)
                        });
                        console.log(`Refund processed via webhook for order ${orderIdStr}`);
                    }
                } catch (err) {
                    console.error("Failed to process refund webhook:", err);
                }
            }
        }
    }

    return NextResponse.json({ received: true });
}
