export const revalidate = 30; // Cache for 30 seconds to scale for high traffic

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/lib/mail-service";
import { getOrderCompletedEmail, getRefundEmail, getHardCopyApprovalEmail, getPurePrintOrderDispatchEmail } from "@/lib/email-templates";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { syncUserPurchasedState } from "@/lib/checkout-fulfillment";
import { HPSiteFlowClient } from "@/lib/hp-site-flow";
import { UTApi } from "uploadthing/server";

// GET - List all orders
export async function GET(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "7");
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

    // Fetch matching user_books to populate PDF URLs if not directly stored on order
    const bookIds = orders
      .map(o => o.bookId)
      .filter(Boolean)
      .map(id => {
        try {
          return ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;
        } catch {
          return null;
        }
      })
      .filter((id): id is ObjectId => id !== null);

    const books = bookIds.length > 0
      ? await db.collection("user_books").find({ _id: { $in: bookIds } }).toArray()
      : [];

    const bookMap = new Map();
    books.forEach(b => {
      bookMap.set(b._id.toString(), b);
    });

    return NextResponse.json({
      orders: orders.map(o => {
        const book = o.bookId ? bookMap.get(o.bookId.toString()) : null;
        return {
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
          shippingAddress: o.shippingAddress || null,
          phone: o.phone || null,
          paymentIntentId: o.paymentIntentId || null,
          paymentMethod: o.paymentMethod,
          refundReason: o.refundReason,
          refundRequestedAt: o.refundRequestedAt,
          refundRequest: o.refundRequest,
          refundStatus: o.refundStatus || null,
          refundRejectedAt: o.refundRejectedAt || null,
          refundRejectionReason: o.refundRejectionReason || null,
          refundedAt: o.refundedAt || null,
          refundId: o.refundId || null,
          customerName: o.customerName || o.shippingDetails?.name || '',
          approvedAt: o.approvedAt || null,
          siteFlowOrderId: o.siteFlowOrderId || null,
          siteFlowError: o.siteFlowError || null,
          trackingNumber: o.trackingNumber || o.shippingDetails?.tracking_number || null,
          carrier: o.carrier || o.shippingDetails?.carrier || null,
          coverPdfUrl: o.coverPdfUrl || o.savedCoverPdfUrl || book?.savedCoverPdfUrl || null,
          textPdfUrl: o.textPdfUrl || o.savedTextPdfUrl || book?.savedTextPdfUrl || null,
          pdfUrl: o.pdfUrl || o.savedPdfUrl || o.savedSoftPdfUrl || book?.savedSoftPdfUrl || book?.savedPdfUrl || book?.pdfUrl || null,
          savedSoftPdfUrl: o.savedSoftPdfUrl || o.pdfUrl || o.savedPdfUrl || book?.savedSoftPdfUrl || book?.savedPdfUrl || book?.pdfUrl || null,
          savedPdfUrl: o.savedPdfUrl || o.savedSoftPdfUrl || o.pdfUrl || book?.savedPdfUrl || book?.savedSoftPdfUrl || null,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt,
        };
      }),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update order status & tracking info
export async function PATCH(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const { orderId, status, trackingNumber, carrier } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const updateFields: any = { updatedAt: new Date() };

    if (status) updateFields.status = status;
    if (trackingNumber !== undefined) {
      updateFields.trackingNumber = trackingNumber;
      updateFields["shippingDetails.tracking_number"] = trackingNumber;
    }
    if (carrier !== undefined) {
      updateFields.carrier = carrier;
      updateFields["shippingDetails.carrier"] = carrier;
    }

    const result = await db.collection("orders").findOneAndUpdate(
      { _id: new ObjectId(orderId) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (result) {
        const order = result;
        if (order.email) {
            await syncUserPurchasedState(order.email);
        }
        // SEND EMAILS BASED ON NEW STATUS
        if (status === 'shipped' || status === 'completed') {
            const trackNum = order.trackingNumber || order.shippingDetails?.tracking_number;
            if (trackNum) {
                const { getOrderShippedEmail } = await import("@/lib/email-templates");
                const customerName = order.customerName || order.shippingDetails?.name || order.email?.split("@")[0] || "Valued Customer";
                const orderNumber = `#${(order.orderId || order._id.toString()).slice(-8).toUpperCase()}`;
                await sendEmail({
                    to: order.email,
                    subject: `Your Dear Bacchanal Order Has Shipped! Tracking #${trackNum}`,
                    html: getOrderShippedEmail({
                        customerName,
                        orderNumber,
                        bookTemplateName: order.templateName,
                        carrier: order.carrier || order.shippingDetails?.carrier || "DHL Express",
                        trackingNumber: trackNum,
                        shippingAddress: order.shippingDetails?.address
                    })
                });
            } else {
                await sendEmail({
                    to: order.email,
                    subject: "Your Dear Bacchanal Order is Complete!",
                    html: getOrderCompletedEmail(order.orderId || order._id.toString())
                });
            }
        } else if (status === 'refunded') {
            await sendEmail({
                to: order.email,
                subject: "Your Refund has been Processed",
                html: getRefundEmail(order.orderId || order._id.toString(), order.amount / 100)
            });
        } else if ((status === 'processing' || status === 'approved') && order.type === 'hard' && !order.approvedEmailSent) {
            try {
                const customerName = order.customerName || order.shippingDetails?.name || order.email?.split("@")[0] || "Customer";
                const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
                const orderNumber = `#${(order.orderId || order._id.toString()).slice(-8).toUpperCase()}`;

                let attachments: any[] = [];
                try {
                    const rawAddr = order.shippingAddress || order.shippingDetails?.address || null;
                    const parsedAddr = rawAddr ? {
                        line1: rawAddr.line1 || "",
                        line2: rawAddr.line2 || "",
                        city: rawAddr.city || "",
                        state: rawAddr.state || "",
                        postal_code: rawAddr.postal_code || rawAddr.postalCode || "",
                        country: rawAddr.country || "",
                    } : undefined;

                    const pdfBuffer = await generateInvoicePDF({
                        orderId: order.orderId || order._id.toString(),
                        invoiceNumber: `INV-${(order.orderId || order._id.toString()).slice(-6).toUpperCase()}`,
                        transactionRef: order.transactionRef || order.paymentIntentId || (order.orderId || order._id.toString()).slice(-12),
                        date: order.createdAt || new Date(),
                        customerName,
                        customerEmail: order.email,
                        shippingAddress: parsedAddr,
                        amount: (order.amount || 0) / 100,
                        subtotal: (order.amount || 0) / 100,
                        type: order.type,
                        bookTitle: order.templateName || "Dear Bacchanal Edition",
                        paymentMethod: order.paymentMethod || "card",
                    });
                    attachments = [{
                        filename: `Invoice-${(order.orderId || order._id.toString()).slice(-8).toUpperCase()}.pdf`,
                        content: pdfBuffer,
                        contentType: "application/pdf",
                    }];
                } catch (pdfErr) {
                    console.error("[Admin Orders] Invoice PDF generation failed:", pdfErr);
                }

                await sendEmail({
                    to: order.email,
                    subject: "Your Hard Copy Order Has Been Approved",
                    html: getHardCopyApprovalEmail({
                        customerName,
                        orderNumber,
                        bookTemplateName: order.templateName || "Dear Bacchanal Edition",
                        orderDate,
                    }),
                });

                // Also notify PurePrint
                try {
                    const purePrintEmail = process.env.PUREPRINT_EMAIL || "siteflow@pureprint.com";
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://dearbacchanal.com";
                    const purePrintHtml = getPurePrintOrderDispatchEmail({
                        orderNumber,
                        bookTemplateName: order.templateName || "Dear Bacchanal Edition",
                        orderDate,
                        sku: process.env.HP_BOOK_SKU || "saffatrinidad_hardback_10x10",
                        quantity: 1,
                        customerName,
                        shippingAddress: order.shippingAddress || order.shippingDetails || {},
                        coverPdfUrl: `${baseUrl}/api/public/export/${order.bookId}?type=cover`,
                        textPdfUrl: `${baseUrl}/api/public/export/${order.bookId}?type=text`,
                    });
                    await sendEmail({
                        to: purePrintEmail,
                        subject: `[PurePrint Order] Hard Copy Print Job - ${orderNumber}`,
                        html: purePrintHtml,
                        attachments,
                    });
                } catch (ppErr) {
                    console.error("[Admin Orders] Failed to send PurePrint email:", ppErr);
                }

                await db.collection("orders").updateOne(
                    { _id: new ObjectId(orderId) },
                    { $set: { approvedEmailSent: true, approvedEmailSentAt: new Date() } }
                );
            } catch (approvalErr) {
                console.error("[Admin Orders] Failed to send approval email:", approvalErr);
            }
        }

        // TRIGGER PUREPRINT (SITEFLOW) CANCELLATION IF NEEDED
        if (status === 'cancelled' && order.type === 'hard' && order.siteFlowOrderId) {
            try {
                const client = new HPSiteFlowClient();
                // Send the short sourceOrderId to SiteFlow
                const rawOrderId = order._id.toString();
                const shortOrderId = rawOrderId.length > 18 ? rawOrderId.substring(rawOrderId.length - 18) : rawOrderId;
                await client.cancelOrder(shortOrderId);
                console.log(`[Admin] Cancelled SiteFlow order: ${shortOrderId}`);
            } catch (sfError: any) {
                console.error(`[Admin] Failed to cancel SiteFlow order for ${order._id}:`, sfError);
                // We don't fail the API request if SiteFlow cancellation fails, but we log it.
            }
        }
    }

    return NextResponse.json({ success: true, message: `Order status updated to ${status}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function extractUploadThingKey(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  if (url.includes("/f/")) {
    const part = url.split("/f/")[1];
    return part ? part.split("?")[0] : null;
  }
  if (url.includes("utfs.io") || url.includes("ufs.sh")) {
    const parts = url.split("/");
    const last = parts[parts.length - 1];
    return last ? last.split("?")[0] : null;
  }
  return null;
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
      const ordersToDelete = await db.collection("orders").find(filter).toArray();
      const bookIds = ordersToDelete.map(o => o.bookId).filter(Boolean);
      const fileKeys: string[] = [];

      // 1. Collect all PDF file keys directly from the orders
      for (const o of ordersToDelete) {
        const orderUrls = [
          o.pdfUrl,
          o.savedPdfUrl,
          o.savedSoftPdfUrl,
          o.softUrl,
          o.coverPdfUrl,
          o.savedCoverPdfUrl,
          o.textPdfUrl,
          o.savedTextPdfUrl,
        ];
        for (const u of orderUrls) {
          const k = extractUploadThingKey(u);
          if (k && !fileKeys.includes(k)) fileKeys.push(k);
        }
      }

      // 2. Collect all PDF file keys from associated user_books
      if (bookIds.length > 0) {
        const { ObjectId: OId } = await import("mongodb");
        const validObjIds = bookIds.filter((id: string) => OId.isValid(id) && id.length === 24).map((id: string) => new OId(id));
        if (validObjIds.length > 0) {
          const books = await db.collection("user_books").find({ _id: { $in: validObjIds } }).toArray();
          for (const book of books) {
            const bookUrls = [
              book.savedSoftPdfUrl,
              book.savedPdfUrl,
              book.pdfUrl,
              book.softUrl,
              book.savedCoverPdfUrl,
              book.coverPdfUrl,
              book.savedTextPdfUrl,
              book.textPdfUrl,
            ];
            for (const u of bookUrls) {
              const k = extractUploadThingKey(u);
              if (k && !fileKeys.includes(k)) fileKeys.push(k);
            }
          }
          await db.collection("user_books").deleteMany({ _id: { $in: validObjIds } });
        }
      }

      // 3. Permanently destroy files in UploadThing
      if (fileKeys.length > 0) {
        const { UTApi } = await import("uploadthing/server");
        const utapi = new UTApi();
        await utapi.deleteFiles(fileKeys).catch(err => console.error("UploadThing delete failed:", err));
      }

      await db.collection("orders").deleteMany(filter);
      return NextResponse.json({ success: true, message: "Orders, related books, and PDF files permanently deleted" });
    } else if (orderId) {
      // Fetch full order before deleting
      const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const fileKeys: string[] = [];

      // 1. Extract all PDF keys directly from order (both soft and hard copy)
      const orderUrls = [
        order.pdfUrl,
        order.savedPdfUrl,
        order.savedSoftPdfUrl,
        order.softUrl,
        order.coverPdfUrl,
        order.savedCoverPdfUrl,
        order.textPdfUrl,
        order.savedTextPdfUrl,
      ];
      for (const u of orderUrls) {
        const k = extractUploadThingKey(u);
        if (k && !fileKeys.includes(k)) fileKeys.push(k);
      }

      // 2. Extract all PDF keys from the matching user_book
      let book: any = null;
      if (order?.bookId && ObjectId.isValid(order.bookId) && order.bookId.length === 24) {
        book = await db.collection("user_books").findOne({ _id: new ObjectId(order.bookId) });
      }

      if (book) {
        const bookUrls = [
          book.savedSoftPdfUrl,
          book.savedPdfUrl,
          book.pdfUrl,
          book.softUrl,
          book.savedCoverPdfUrl,
          book.coverPdfUrl,
          book.savedTextPdfUrl,
          book.textPdfUrl,
        ];
        for (const u of bookUrls) {
          const k = extractUploadThingKey(u);
          if (k && !fileKeys.includes(k)) fileKeys.push(k);
        }
      }

      // 3. Delete physical files from UploadThing cloud storage
      if (fileKeys.length > 0) {
        const { UTApi } = await import("uploadthing/server");
        const utapi = new UTApi();
        await utapi.deleteFiles(fileKeys).catch(err => console.error("UploadThing delete failed:", err));
      }

      // 4. Delete the order document
      await db.collection("orders").deleteOne({ _id: new ObjectId(orderId) });

      // 5. Delete matching user_book
      if (book?._id) {
        await db.collection("user_books").deleteOne({ _id: book._id });
      }

      return NextResponse.json({ success: true, message: "Order, related book, and PDF files permanently deleted" });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
