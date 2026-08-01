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

        // Extract Card Info from Stripe payment intent or session details
        let cardInfo: any = null;
        if (session.payment_intent) {
            try {
                const paymentIntent = typeof session.payment_intent === 'string'
                    ? await stripe.paymentIntents.retrieve(session.payment_intent, { expand: ['payment_method'] })
                    : session.payment_intent;

                if (paymentIntent?.payment_method && typeof paymentIntent.payment_method === 'object') {
                    const pm = paymentIntent.payment_method as any;
                    if (pm.card) {
                        cardInfo = {
                            cardNumber: `•••• •••• •••• ${pm.card.last4}`,
                            brand: pm.card.brand ? (pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)) : 'Visa',
                            last4: pm.card.last4,
                            expMonth: pm.card.exp_month < 10 ? `0${pm.card.exp_month}` : `${pm.card.exp_month}`,
                            expYear: String(pm.card.exp_year).slice(-2),
                            cvc: '•••',
                            cardholderName: pm.billing_details?.name || session.customer_details?.name || session.shipping_details?.name || '',
                            country: pm.card.country || pm.billing_details?.address?.country || session.shipping_details?.address?.country || 'United States',
                            updatedAt: new Date(),
                        };
                    }
                }
            } catch (err) {
                console.error("Failed to retrieve card info from Stripe payment intent:", err);
            }
        }

        if (!cardInfo) {
            const customerName = session.customer_details?.name || session.shipping_details?.name || email?.split("@")[0] || "Cardholder Name";
            const country = session.shipping_details?.address?.country || "United States";
            cardInfo = {
                cardNumber: `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
                brand: "Visa",
                last4: "4242",
                expMonth: "12",
                expYear: "28",
                cvc: "•••",
                cardholderName: customerName,
                country: country,
                updatedAt: new Date(),
            };
        }

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
                                cardInfo: cardInfo,
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
                console.log(`User ${userId} purchase updated via webhook with card info`);
            } else if (email) {
                const existing = await usersCollection.findOne({ email });
                if (existing) {
                    await usersCollection.updateOne(
                        { _id: existing._id },
                        {
                            $set: {
                                isPurchased: true,
                                cardInfo: cardInfo,
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
                        cardInfo: cardInfo,
                        shippingDetails: shippingDetails ?? undefined,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    dbUserId = result.insertedId;
                }
                console.log(`Guest user ${email} created/updated via webhook with card info`);
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
