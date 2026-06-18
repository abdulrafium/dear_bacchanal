export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/lib/mail-service";
import { getOrderCompletedEmail, getRefundEmail } from "@/lib/email-templates";

// GET - List all orders
export async function GET(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const typeFilter = searchParams.get("type") || "";
    const statusFilter = searchParams.get("status") || "";

    const filter: any = {};
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { templateName: { $regex: search, $options: "i" } },
      ];
    }
    if (typeFilter) {
      filter.type = typeFilter;
    }
    if (statusFilter) {
      filter.status = statusFilter;
    }

    const total = await db.collection("orders").countDocuments(filter);
    const orders = await db.collection("orders")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      orders: orders.map(o => ({
        id: o._id.toString(),
        userId: o.userId?.toString(),
        email: o.email,
        orderId: o.orderId,
        amount: o.amount,
        currency: o.currency,
        type: o.type,
        templateName: o.templateName,
        bookId: o.bookId,
        status: o.status,
        shippingDetails: o.shippingDetails,
        paymentMethod: o.paymentMethod,
        refundReason: o.refundReason,
        refundRequestedAt: o.refundRequestedAt,
        refundRequest: o.refundRequest,
        customerName: o.customerName || o.shippingDetails?.name || '',
        approvedAt: o.approvedAt || null,
        siteFlowOrderId: o.siteFlowOrderId || null,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update order status
export async function PATCH(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId and status required" }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: 'after' }
    );

    if (result) {
        const order = result;
        // SEND EMAILS BASED ON NEW STATUS
        if (status === 'shipped' || status === 'completed') {
            await sendEmail({
                to: order.email,
                subject: "Your Dear Bacchanal Order is Complete!",
                html: getOrderCompletedEmail(order.orderId || order._id.toString())
            });
        } else if (status === 'refunded') {
            await sendEmail({
                to: order.email,
                subject: "Your Refund has been Processed",
                html: getRefundEmail(order.orderId || order._id.toString(), order.amount / 100)
            });
        }
    }

    return NextResponse.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
