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

// DELETE - Delete order(s) and associated user_book records
export async function DELETE(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const deleteAll = searchParams.get("deleteAll") === "true";
    const status = searchParams.get("status");

    if (deleteAll) {
      const filter = status ? { status } : {};
      // Collect all bookIds so we can cascade-delete user_books
      const ordersToDelete = await db.collection("orders").find(filter, { projection: { bookId: 1 } }).toArray();
      const bookIds = ordersToDelete.map(o => o.bookId).filter(Boolean);
      // Delete orders
      await db.collection("orders").deleteMany(filter);
      // Cascade: delete matching user_books (never touches global templates)
      if (bookIds.length > 0) {
        const { ObjectId: OId } = await import("mongodb");
        const validObjIds = bookIds.filter((id: string) => OId.isValid(id) && id.length === 24).map((id: string) => new OId(id));
        if (validObjIds.length > 0) {
          await db.collection("user_books").deleteMany({ _id: { $in: validObjIds } });
        }
      }
      return NextResponse.json({ success: true, message: "Orders and related books deleted" });
    } else if (orderId) {
      // Fetch bookId from order before deleting
      const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) }, { projection: { bookId: 1 } });
      await db.collection("orders").deleteOne({ _id: new ObjectId(orderId) });
      // Cascade: delete matching user_book
      if (order?.bookId && ObjectId.isValid(order.bookId) && order.bookId.length === 24) {
        await db.collection("user_books").deleteOne({ _id: new ObjectId(order.bookId) });
      }
      return NextResponse.json({ success: true, message: "Order and related book deleted" });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
