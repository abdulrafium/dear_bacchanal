import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { orderId, reason } = await req.json();

        if (!orderId || !reason) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const db = await getDatabase();
        const ordersCollection = db.collection("orders");

        let orderIdObj;
        try { orderIdObj = new ObjectId(orderId); } catch { orderIdObj = null; }

        let userIdObj;
        try { userIdObj = new ObjectId(session.user.id); } catch { userIdObj = null; }

        const orderMatch = [{ orderId: orderId }];
        if (orderIdObj) orderMatch.push({ _id: orderIdObj } as any);

        const userMatch = [
            { userId: session.user.id },
            { email: session.user.email }
        ];
        if (userIdObj) userMatch.push({ userId: userIdObj } as any);

        const order = await ordersCollection.findOne({
            $and: [
                { $or: orderMatch },
                { $or: userMatch }
            ]
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found or unauthorized" }, { status: 404 });
        }

        if (order.status === 'refund_pending' || order.status === 'refunded') {
            return NextResponse.json({ error: "Refund already requested or processed" }, { status: 400 });
        }

        await ordersCollection.updateOne(
            { _id: order._id },
            { 
                $set: { 
                    status: "refund_pending",
                    refundReason: reason,
                    refundRequestedAt: new Date()
                } 
            }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error processing refund request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
