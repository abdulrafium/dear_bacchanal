import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { sendEmail } from "@/lib/mail-service";
import { getOrderCompletedEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { TimeStamp, SourceOrderId, OrderStatus, TrackingNumber, Carrier } = body;

        if (!SourceOrderId || !OrderStatus) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const db = await getDatabase();
        const ordersCollection = db.collection("orders");

        let rawStatus = OrderStatus.toString().toLowerCase();
        let normalizedStatus = rawStatus;

        if (rawStatus === 'completed' || rawStatus === 'despatched' || rawStatus === 'dispatch' || rawStatus === 'shipped') {
            normalizedStatus = 'shipped';
        } else if (rawStatus === 'delivered') {
            normalizedStatus = 'delivered';
        } else if (rawStatus === 'in_production' || rawStatus === 'produced' || rawStatus === 'printed' || rawStatus === 'processing') {
            normalizedStatus = 'processing';
        } else if (rawStatus === 'cancelled' || rawStatus === 'canceled') {
            normalizedStatus = 'cancelled';
        }
        
        const updateDoc: any = {
            status: normalizedStatus,
            siteFlowStatus: OrderStatus,
            updatedAt: new Date(),
        };

        if (TrackingNumber) {
            updateDoc.trackingNumber = TrackingNumber;
            updateDoc["shippingDetails.tracking_number"] = TrackingNumber;
        }

        if (Carrier) {
            updateDoc.carrier = Carrier;
            updateDoc["shippingDetails.carrier"] = Carrier;
        }

        // The SourceOrderId sent to SiteFlow is the last 18 characters of the MongoDB _id.
        const pendingOrders = await ordersCollection.find({ type: "hard", status: { $ne: "cancelled" } }).toArray();
        const matchedOrder = pendingOrders.find(o => o._id.toString().endsWith(SourceOrderId));

        if (!matchedOrder) {
            console.warn(`Webhook received for unknown or already cancelled order: ${SourceOrderId}`);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        await ordersCollection.updateOne(
            { _id: matchedOrder._id },
            { $set: updateDoc }
        );

        // Send customer email if PurePrint successfully ships or completes the order
        if ((normalizedStatus === 'shipped' || normalizedStatus === 'delivered') && matchedOrder.email) {
            if (matchedOrder.status !== 'shipped' && matchedOrder.status !== 'delivered') {
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
