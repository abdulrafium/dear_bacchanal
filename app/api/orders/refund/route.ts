import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, reason } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const db = await getDatabase();
    
    // 1. Fetch the order
    const order = await db.collection("orders").findOne({ 
        _id: new ObjectId(orderId),
        userId: user.id 
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Check if already refunded or pending
    if (order.status === 'refunded' || order.status === 'refund_pending') {
        return NextResponse.json({ error: "Refund already processed or pending" }, { status: 400 });
    }

    // 3. Mark as refund_pending
    await db.collection("orders").updateOne(
        { _id: new ObjectId(orderId) },
        { 
            $set: { 
                status: 'refund_pending',
                refundRequest: {
                    reason,
                    requestedAt: new Date(),
                    status: 'pending'
                }
            } 
        }
    );

    return NextResponse.json({ success: true, message: "Refund request submitted successfully" });
  } catch (error: any) {
    console.error("Refund request error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
