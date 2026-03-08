import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

/**
 * Printing publisher status webhook.
 * Give the publisher this URL to receive order status updates:
 *   POST {NEXTAUTH_URL}/api/webhooks/printing
 *
 * Supported payloads: OrderStatus received | error | printready | shipped,
 * plus Order submission error (OrderId, status, errorsClean).
 */
type PrintingWebhookPayload =
  | { TimeStamp: string; SourceOrderId: string; OrderStatus: "received" | "error" | "printready" }
  | { SourceOrderId: string; TimeStamp: string; TrackingNumber?: string; OrderStatus: "shipped" }
  | { TimeStamp: string; OrderId: string; status: string; errorsClean?: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as PrintingWebhookPayload;

    const db = await getDatabase();
    const ordersCollection = db.collection("orders");

    const sourceOrderId =
      "SourceOrderId" in body ? body.SourceOrderId : "OrderId" in body ? body.OrderId : null;

    if (!sourceOrderId) {
      console.warn("Printing webhook: missing SourceOrderId/OrderId", body);
      return NextResponse.json({ received: true });
    }

    const orderStatus =
      "OrderStatus" in body
        ? body.OrderStatus
        : "status" in body
          ? body.status
          : "unknown";

    const update: Record<string, unknown> = {
      orderStatus,
      updatedAt: new Date(),
    };
    if ("TrackingNumber" in body && body.TrackingNumber) {
      update.trackingNumber = body.TrackingNumber;
    }
    if ("errorsClean" in body && body.errorsClean) {
      update.errorsClean = body.errorsClean;
    }
    if ("TimeStamp" in body) {
      update.webhookTimeStamp = body.TimeStamp;
    }

    const result = await ordersCollection.updateOne(
      { sourceOrderId },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      console.warn("Printing webhook: no order found for", sourceOrderId, body);
    } else {
      console.log("Printing webhook: updated order", sourceOrderId, "to", orderStatus);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Printing webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
