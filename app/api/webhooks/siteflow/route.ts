import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { TimeStamp, SourceOrderId, OrderStatus, TrackingNumber } = body;

        if (!SourceOrderId || !OrderStatus) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const db = await getDatabase();
        const ordersCollection = db.collection("orders");

        const updateDoc: any = {
            status: OrderStatus,
            updatedAt: new Date(),
        };

        if (TrackingNumber) {
            updateDoc.trackingNumber = TrackingNumber;
        }

        const result = await ordersCollection.updateOne(
            { orderId: SourceOrderId },
            { $set: updateDoc }
        );

        if (result.matchedCount === 0) {
            console.warn(`Webhook received for unknown order: ${SourceOrderId}`);
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        console.log(`Order ${SourceOrderId} status updated to ${OrderStatus}`);
        return NextResponse.json({ success: true, message: "Order status updated" }, { status: 200 });
    } catch (error: any) {
        console.error("Siteflow Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
