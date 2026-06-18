/**
 * POST /api/admin/orders/test-webhook
 * 
 * Dev-only endpoint that simulates what the Stripe webhook does for a hard copy order.
 * Used to test the full workflow without needing the Stripe CLI running.
 * 
 * Body: { orderId: string }  — the MongoDB _id of an existing order to reset to pending_approval
 *   OR: leave body empty to patch all hard copy orders that aren't already pending_approval/approved
 */

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/lib/mail-service";
import { getHardCopyOrderReceivedEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const db = await getDatabase();
    const ordersCollection = db.collection("orders");

    let query: any;

    if (body.orderId) {
      // Patch a specific order
      query = { _id: new ObjectId(body.orderId) };
    } else {
      // Patch all hard copy orders that are in 'processing' status (old status)
      query = { type: "hard", status: { $in: ["processing", "paid"] } };
    }

    const orders = await ordersCollection.find(query).toArray();

    if (orders.length === 0) {
      return NextResponse.json({ 
        message: "No orders found to patch. They may already be pending_approval or approved.",
        patched: 0
      });
    }

    const results = [];

    for (const order of orders) {
      // 1. Set to pending_approval
      await ordersCollection.updateOne(
        { _id: order._id },
        { $set: { status: "pending_approval", updatedAt: new Date() } }
      );

      // 2. Send "order received" email to customer
      if (order.email) {
        try {
          const customerName =
            order.customerName ||
            order.shippingDetails?.name ||
            order.email.split("@")[0] ||
            "Customer";

          const orderDate = new Date(order.createdAt || new Date()).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const orderNumber = `#${(order.orderId || order._id.toString()).slice(-8).toUpperCase()}`;

          const emailHtml = getHardCopyOrderReceivedEmail({
            customerName,
            orderNumber,
            bookTemplateName: order.templateName || "Dear Bacchanal Edition",
            orderDate,
          });

          await sendEmail({
            to: order.email,
            subject: "Hard Copy Order Received",
            html: emailHtml,
          });

          console.log(`[test-webhook] Sent order received email to ${order.email}`);
          results.push({ orderId: order._id.toString(), status: "patched", emailSent: true });
        } catch (emailErr) {
          console.error(`[test-webhook] Email failed for ${order._id}:`, emailErr);
          results.push({ orderId: order._id.toString(), status: "patched", emailSent: false, emailError: (emailErr as any)?.message });
        }
      } else {
        results.push({ orderId: order._id.toString(), status: "patched", emailSent: false, reason: "no email on order" });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Patched ${results.length} order(s) to pending_approval and sent order received emails.`,
      results,
    });
  } catch (error: any) {
    console.error("[test-webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
