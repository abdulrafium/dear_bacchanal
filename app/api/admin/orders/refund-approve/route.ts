import { NextRequest, NextResponse } from "next/server";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { stripe } from "@/lib/stripe";

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

    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    const paymentIntentId = session.payment_intent as string;

    if (!paymentIntentId) {
        return NextResponse.json({ error: "Payment Intent not found for this session" }, { status: 400 });
    }

    // 2. TRIGGER STRIPE REFUND
    const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer'
    });

    if (refund.status === 'succeeded' || refund.status === 'pending') {
        // 3. Update DB
        await db.collection("orders").updateOne(
            { _id: new ObjectId(orderId) },
            { 
                $set: { 
                    status: 'refunded',
                    refundedAt: new Date(),
                    refundId: refund.id
                } 
            }
        );
        return NextResponse.json({ success: true, refundId: refund.id });
    } else {
        throw new Error(`Stripe refund status: ${refund.status}`);
    }

  } catch (error: any) {
    console.error("Refund approval error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
