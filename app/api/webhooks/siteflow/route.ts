import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { sendEmail } from "@/lib/mail-service";
import { getOrderCompletedEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { TimeStamp, SourceOrderId, OrderStatus, TrackingNumber } = body;

        if (!SourceOrderId || !OrderStatus) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const db = await getDatabase();
        const ordersCollection = db.collection("orders");

        const normalizedStatus = OrderStatus.toLowerCase();
        
        const updateDoc: any = {
            status: normalizedStatus,
            updatedAt: new Date(),
        };

        if (TrackingNumber) {
            updateDoc.trackingNumber = TrackingNumber;
        }

        // The SourceOrderId sent to SiteFlow is the last 18 characters of the MongoDB _id.
        // The `orderId` field in the database is the Stripe Checkout Session ID.
        // We must fetch hard-copy orders and find the one whose _id ends with SourceOrderId.
        const pendingOrders = await ordersCollection.find({ type: "hard", status: { $ne: "cancelled" } }).toArray();
        const matchedOrder = pendingOrders.find(o => o._id.toString().endsWith(SourceOrderId));

        if (!matchedOrder) {
            console.warn(`Webhook received for unknown or already cancelled order: ${SourceOrderId}`);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        const result = await ordersCollection.updateOne(
            { _id: matchedOrder._id },
            { $set: updateDoc }
        );

        // Send customer email if PurePrint successfully ships or completes the order
        if ((normalizedStatus === 'shipped' || normalizedStatus === 'completed' || normalizedStatus === 'delivered') && matchedOrder.email) {
            // Only send if it wasn't already marked shipped to avoid spamming
            if (matchedOrder.status !== 'shipped' && matchedOrder.status !== 'completed' && matchedOrder.status !== 'delivered') {
                await sendEmail({
                    to: matchedOrder.email,
                    subject: TrackingNumber ? "Your Dear Bacchanal Order has Shipped!" : "Your Dear Bacchanal Order is Complete!",
                    html: getOrderCompletedEmail(matchedOrder.orderId || matchedOrder._id.toString())
                });
            }
        }

        console.log(`Order ${SourceOrderId} status updated to ${normalizedStatus}`);
        return NextResponse.json({ success: true, message: "Order status updated" }, { status: 200 });
    } catch (error: any) {
        console.error("Siteflow Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
