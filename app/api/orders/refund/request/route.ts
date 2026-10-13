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

        if (!orderId || !reason || typeof reason !== "string" || !reason.trim()) {
            return NextResponse.json({ error: "Please provide a mandatory refund reason." }, { status: 400 });
        }
        if (reason.trim().length > 50) {
            return NextResponse.json({ error: "Refund reason must be a short message of maximum 50 characters." }, { status: 400 });
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

        // 1. Hard Copy print check: Only allowed while pending_approval before admin approval
        const isHardCopy = (order.type?.toLowerCase() === 'hard' || order.orderType?.toLowerCase() === 'hard');
        if (isHardCopy && order.status !== 'pending_approval') {
            return NextResponse.json({
                error: "This order has already been approved and sent to PurePrint for printing and binding. According to our policy, hard copy orders cannot be refunded once printing has commenced."
            }, { status: 400 });
        }

        // 2. Refund deadline check from platform settings
        const settings = await db.collection("settings").findOne({ id: "platform_settings" });
        const refundDeadlineDays = settings?.general?.refundDeadlineDays ?? 14;
        if (order.createdAt) {
            const orderDate = new Date(order.createdAt).getTime();
            const now = Date.now();
            const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
            if (diffDays > refundDeadlineDays) {
                return NextResponse.json({
                    error: `Sorry, you cannot request a refund. The ${refundDeadlineDays}-day refund window for this order has expired according to our refund policy.`
                }, { status: 400 });
            }
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
