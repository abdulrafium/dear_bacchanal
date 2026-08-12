import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { ObjectId } from "mongodb";
import { HPSiteFlowClient } from "@/lib/hp-site-flow";

export async function POST(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const ordersCollection = db.collection("orders");

    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const sku = process.env.HP_BOOK_SKU || "saffatrinidad_hardback_10x10";
    const client = new HPSiteFlowClient();

    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://dearbacchanal.com";
    if (baseUrl.includes("localhost")) {
      baseUrl = "https://dearbacchanal.com";
    }

    const rawOrderId = orderId.toString();
    const shortOrderId = rawOrderId.length > 18 ? rawOrderId.substring(rawOrderId.length - 18) : rawOrderId;
    const rawItemId = order.bookId || rawOrderId;
    const shortItemId = rawItemId.length > 18 ? rawItemId.substring(rawItemId.length - 18) : rawItemId;

    const metaAddress = order.shippingAddress || {};
    const stripeAddress = order.shippingDetails?.address || {};

    const resolvedName = order.customerName || order.shippingDetails?.name || metaAddress.name || "Customer";
    const resolvedLine1 = metaAddress.line1 || stripeAddress.line1 || "";
    const resolvedLine2 = metaAddress.line2 || stripeAddress.line2 || "";
    const resolvedCity = metaAddress.city || stripeAddress.city || "";
    const resolvedState = metaAddress.state || stripeAddress.state || "";
    const resolvedPostal = metaAddress.postalCode || stripeAddress.postal_code || metaAddress.postal_code || "";
    const resolvedCountry = metaAddress.country || stripeAddress.country || "US";
    const resolvedPhone = metaAddress.phone || "";

    const siteFlowResult = await client.createOrder({
      sourceOrderId: shortOrderId,
      items: [
        {
          sourceItemId: shortItemId,
          sku: sku,
          quantity: 1,
          components: [
            {
              code: "cover",
              path: `${baseUrl}/api/public/export/${order.bookId}?type=cover`,
              fetch: true,
            },
            {
              code: "text",
              path: `${baseUrl}/api/public/export/${order.bookId}?type=text`,
              fetch: true,
            },
          ],
        },
      ],
      shippingInfo: {
        name: resolvedName,
        line1: resolvedLine1,
        line2: resolvedLine2,
        city: resolvedCity,
        state: resolvedState,
        postalCode: resolvedPostal,
        country: resolvedCountry,
        email: order.email || "",
        phone: resolvedPhone,
        shippingMethod: "standard",
      },
    });

    const siteFlowOrderId = siteFlowResult?._id || siteFlowResult?.id || null;

    await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          siteFlowOrderId,
          sourceOrderId: shortOrderId,
          siteFlowSubmittedAt: new Date(),
        },
        $unset: { siteFlowError: "" }
      }
    );

    return NextResponse.json({
      success: true,
      message: "Order successfully submitted to PurePrint (SiteFlow)",
      siteFlowOrderId,
    });
  } catch (error: any) {
    console.error("Resubmit SiteFlow Error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit to SiteFlow" }, { status: 500 });
  }
}
