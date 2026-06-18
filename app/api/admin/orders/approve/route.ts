import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/lib/mail-service";
import { getHardCopyApprovalEmail } from "@/lib/email-templates";
import { generateInvoicePDF } from "@/lib/pdf-generator";
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

    // Fetch the order
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.type !== "hard") {
      return NextResponse.json({ error: "Only hard copy orders can be approved" }, { status: 400 });
    }

    if (order.status !== "pending_approval") {
      return NextResponse.json(
        { error: `Cannot approve order with status '${order.status}'. Order must be in 'pending_approval' state.` },
        { status: 400 }
      );
    }

    const approvedAt = new Date();

    // ─── 1. Update order status to 'processing' ────────────────────────────────
    await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: "processing",
          approvedAt,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`[approve] Order ${orderId} approved. Status set to 'processing'`);

    // ─── 2. Generate Invoice PDF ───────────────────────────────────────────────
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generateInvoicePDF({
        orderId: order.orderId || orderId,
        date: order.createdAt || approvedAt,
        customerName:
          order.customerName ||
          order.shippingDetails?.name ||
          order.email?.split("@")[0] ||
          "Customer",
        customerEmail: order.email || "",
        amount: (order.amount || 0) / 100,
        type: order.type,
        bookTitle: order.templateName || "Dear Bacchanal Edition",
      });
    } catch (pdfError) {
      console.error("[approve] Failed to generate invoice PDF:", pdfError);
      // Continue – don't block approval if PDF generation fails
    }

    // ─── 3. Send Approval Email to Customer ────────────────────────────────────
    let emailToSendTo = order.email;
    let registeredUser = null;
    
    if (order.userId) {
      const usersCollection = db.collection("users");
      try {
        const query = ObjectId.isValid(order.userId) ? { _id: new ObjectId(order.userId) } : { email: order.email };
        registeredUser = await usersCollection.findOne(query);
        if (registeredUser?.email) {
          emailToSendTo = registeredUser.email;
        }
      } catch (e) {
        console.error("Failed to fetch user email for approval email", e);
      }
    }

    if (emailToSendTo) {
      try {
        const customerName =
          registeredUser?.name ||
          order.customerName ||
          order.shippingDetails?.name ||
          emailToSendTo.split("@")[0] ||
          "Customer";

        const orderDate = (order.createdAt
          ? new Date(order.createdAt)
          : approvedAt
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const orderNumber = `#${(order.orderId || orderId).slice(-8).toUpperCase()}`;

        const emailHtml = getHardCopyApprovalEmail({
          customerName,
          orderNumber,
          bookTemplateName: order.templateName || "Dear Bacchanal Edition",
          orderDate,
        });

        const attachments =
          pdfBuffer
            ? [
                {
                  filename: `Invoice-${(order.orderId || orderId).slice(-8).toUpperCase()}.pdf`,
                  content: pdfBuffer,
                  contentType: "application/pdf",
                },
              ]
            : [];

        await sendEmail({
          to: emailToSendTo,
          subject: "Your Hard Copy Order Has Been Approved",
          html: emailHtml,
          attachments,
        });

        console.log(`[approve] Approval email sent to ${emailToSendTo}`);
      } catch (emailError) {
        console.error("[approve] Failed to send approval email:", emailError);
        // Don't block; log and continue
      }
    }

    // ─── 4. Submit to Site Flow / PurePrint ───────────────────────────────────
    let siteFlowOrderId: string | null = null;
    try {
      const client = new HPSiteFlowClient();

      const shippingDetails = order.shippingDetails;

      // Stripe stores address nested under shippingDetails.address
      // Our custom form stores it flat in shippingDetails directly OR as JSON in order.shippingAddress
      const stripeAddress = shippingDetails?.address || {};

      // Try to parse custom form address from order metadata
      let metaAddress: any = {};
      if (order.shippingAddress) {
        try {
          metaAddress = typeof order.shippingAddress === "string"
            ? JSON.parse(order.shippingAddress)
            : order.shippingAddress;
        } catch {}
      }

      // Resolve each field with fallback chain: Stripe > metadata > flat shippingDetails
      const resolvedName =
        order.customerName || shippingDetails?.name || metaAddress?.name || order.email?.split("@")[0] || "Customer";
      const resolvedLine1 =
        stripeAddress.line1 || metaAddress?.line1 || shippingDetails?.line1 || "";
      const resolvedLine2 =
        stripeAddress.line2 || metaAddress?.line2 || shippingDetails?.line2 || "";
      const resolvedCity =
        stripeAddress.city || metaAddress?.city || shippingDetails?.city || "";
      const resolvedState =
        stripeAddress.state || metaAddress?.state || shippingDetails?.state || "";
      const resolvedPostal =
        stripeAddress.postal_code || stripeAddress.postalCode ||
        metaAddress?.postalCode || metaAddress?.postal_code ||
        shippingDetails?.postalCode || shippingDetails?.postal_code || "";
      const resolvedCountry =
        stripeAddress.country || metaAddress?.country || shippingDetails?.country || "US";
      const resolvedPhone =
        shippingDetails?.phone || metaAddress?.phone || "";

      // Log resolved address for debugging
      console.log(`[approve] Resolved shipping address:`, {
        name: resolvedName, line1: resolvedLine1, city: resolvedCity,
        state: resolvedState, postalCode: resolvedPostal, country: resolvedCountry,
      });
      if (!resolvedLine1 || !resolvedCity || !resolvedPostal) {
        console.warn(`[approve] ⚠️ Incomplete shipping address. Raw shippingDetails:`, JSON.stringify(shippingDetails));
      }

      const baseUrl = process.env.NEXTAUTH_URL || "https://dearbacchanal.com";

      const siteFlowResult = await client.createOrder({
        sourceOrderId: order.orderId || orderId,
        items: [
          {
            sourceItemId: order.bookId || order.orderId || orderId,
            sku: process.env.HP_BOOK_SKU || "saffatrinidad_hardback_10x10_staging",
            quantity: 1,
            components: [
              {
                code: "cover",
                path: registeredUser?.savedPdfUrl || `${baseUrl}/api/public/export/${order.bookId}?type=cover`,
                fetch: true,
              },
              {
                code: "text",
                path: registeredUser?.savedPdfUrl || `${baseUrl}/api/public/export/${order.bookId}?type=text`,
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

      siteFlowOrderId = siteFlowResult?._id || siteFlowResult?.id || null;
      console.log(`[approve] Order submitted to Site Flow. Response:`, siteFlowResult);

      // Persist the Site Flow order ID on the DB record
      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            siteFlowOrderId,
            siteFlowSubmittedAt: new Date(),
          },
        }
      );
    } catch (siteFlowError) {
      console.error("[approve] Failed to submit order to Site Flow:", siteFlowError);
      // Store the error but don't fail the entire approval
      await ordersCollection.updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            siteFlowError: (siteFlowError as any)?.message || "Unknown error",
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order approved. Status set to processing. Customer notified with invoice. Submitted to PurePrint.",
      approvedAt,
      status: "processing",
      siteFlowOrderId,
    });
  } catch (error: any) {
    console.error("[approve] Unhandled error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
