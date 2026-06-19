import { NextRequest, NextResponse } from "next/server";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { stripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/mail-service";
import { getRefundEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const authResponse = await adminAuthMiddleware();
    if (authResponse) return authResponse;

    const { orderId } = await req.json();
    if (!orderId) {
        return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });

    if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === 'refunded') {
        return NextResponse.json({ error: "Order already refunded" }, { status: 400 });
    }

    // 1. Get Payment Intent or Charge from Stripe metadata if needed
    // Stripe checkout session creates a payment intent. 
    // We store the session ID in 'id'? No, Stripe creates it.
    // Let's assume order.stripeSessionId exists.
    
    // FETCH THE SESSION FROM STRIPE TO GET PAYMENT INTENT
    const stripeSessionId = order.orderId; 
    if (!stripeSessionId) {
        return NextResponse.json({ error: "Stripe Session ID missing from order record" }, { status: 400 });
    }

    // BYPASS STRIPE FOR MOCK/TEST ORDERS (e.g. NAQJ0LQU)
    if (!stripeSessionId.startsWith('cs_')) {
        const updatedOrder = await db.collection("orders").findOneAndUpdate(
            { _id: new ObjectId(orderId) },
            { 
                $set: { 
                    status: 'refunded',
                    refundedAt: new Date(),
                    refundId: `mock_refund_${Date.now()}`
                } 
            },
            { returnDocument: 'after' }
        );

        if (updatedOrder && updatedOrder.email) {
            await sendEmail({
                to: updatedOrder.email,
                subject: "Your Refund has been Processed",
                html: getRefundEmail(updatedOrder.orderId || updatedOrder._id.toString(), Math.floor(updatedOrder.amount * 0.8) / 100)
            });
        }

        return NextResponse.json({ success: true, message: "Mock order refunded locally" });
    }

    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    const paymentIntentId = session.payment_intent as string;

    if (!paymentIntentId) {
        return NextResponse.json({ error: "Payment Intent not found for this session" }, { status: 400 });
    }

    // 2. CALCULATE 80% NET REFUND (20% DEDUCTION)
    // order.amount is stored in cents (e.g., 10000 = $100.00)
    const refundAmount = Math.floor(order.amount * 0.8);

    // 3. TRIGGER STRIPE PARTIAL REFUND
    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: refundAmount,
            reason: 'requested_by_customer',
            metadata: {
                orderId: orderId.toString()
            }
        });

        if (refund.status === 'succeeded' || refund.status === 'pending') {
            const updatedOrder = await db.collection("orders").findOneAndUpdate(
                { _id: new ObjectId(orderId) },
                { 
                    $set: { 
                        status: 'refunded',
                        refundedAt: new Date(),
                        refundId: refund.id
                    } 
                },
                { returnDocument: 'after' }
            );

            if (updatedOrder && updatedOrder.email) {
                await sendEmail({
                    to: updatedOrder.email,
                    subject: "Your Refund has been Processed",
                    html: getRefundEmail(updatedOrder.orderId || updatedOrder._id.toString(), Math.floor(updatedOrder.amount * 0.8) / 100)
                });
            }

            return NextResponse.json({ success: true, refundId: refund.id });
        } else {
            throw new Error(`Stripe refund status: ${refund.status}`);
        }
    } catch (stripeError: any) {
        if (stripeError.code === 'amount_too_large' || stripeError.message?.includes('greater than unrefunded amount')) {
            console.log(`Order ${orderId} already partially refunded via Stripe. Forcing DB update.`);
            const updatedOrder = await db.collection("orders").findOneAndUpdate(
                { _id: new ObjectId(orderId) },
                { 
                    $set: { 
                        status: 'refunded',
                        refundedAt: new Date()
                    } 
                },
                { returnDocument: 'after' }
            );

            if (updatedOrder && updatedOrder.email) {
                await sendEmail({
                    to: updatedOrder.email,
                    subject: "Your Refund has been Processed",
                    html: getRefundEmail(updatedOrder.orderId || updatedOrder._id.toString(), Math.floor(updatedOrder.amount * 0.8) / 100)
                });
            }
            
            return NextResponse.json({ success: true, message: "Order was already refunded. Status synced." });
        }
        throw stripeError;
    }

  } catch (error: any) {
    console.error("Refund approval error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
