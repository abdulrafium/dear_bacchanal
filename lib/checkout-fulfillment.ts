import { ObjectId } from "mongodb";
import { getDatabase } from "./db";
import { sendEmail } from "./mail-service";
import {
  getOrderConfirmationEmail,
  getHardCopyOrderReceivedEmail,
} from "./email-templates";
import { generateInvoicePDF } from "./pdf-generator";

export type StripeCheckoutSession = {
  id: string;
  metadata?: Record<string, string | undefined> | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null; name?: string | null } | null;
  shipping_details?: { name?: string } | null;
  amount_total?: number | null;
  currency?: string | null;
  payment_method_types?: string[] | null;
  created?: number;
};

export function getCustomerEmail(session: StripeCheckoutSession): string | undefined {
  const email = session.customer_email || session.customer_details?.email;
  return email || undefined;
}

export function buildOrderRecord(
  session: StripeCheckoutSession,
  userId: string | ObjectId | null
) {
  const orderType = session.metadata?.orderType || "soft";
  const email = getCustomerEmail(session);
  const shippingDetails = session.shipping_details;

  // Parse custom shipping form data stored as JSON in Stripe metadata
  let parsedShippingAddress: any = null;
  if (session.metadata?.shippingAddress) {
    try {
      parsedShippingAddress = JSON.parse(session.metadata.shippingAddress);
    } catch {}
  }

  return {
    userId: userId
      ? typeof userId === "string"
        ? userId
        : userId.toString()
      : null,
    email: email || "",
    orderId: session.id,
    amount: session.amount_total || 0,
    currency: session.currency || "usd",
    type: orderType,
    templateName: session.metadata?.templateName || "",
    bookId: session.metadata?.bookId || "",
    status: orderType === "hard" ? "pending_approval" : "paid",
    shippingDetails: shippingDetails || null,
    // Also save the custom form shipping address separately for SiteFlow use
    shippingAddress: parsedShippingAddress || null,
    paymentMethod: session.payment_method_types?.[0] || "card",
    customerName:
      session.customer_details?.name ||
      shippingDetails?.name ||
      parsedShippingAddress?.name ||
      email?.split("@")[0] ||
      "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/** Create order if missing; fix legacy hard-copy rows stuck on `processing`. */
export async function upsertOrderFromCheckoutSession(
  session: StripeCheckoutSession,
  userId: string | ObjectId | null
) {
  const db = await getDatabase();
  const ordersCollection = db.collection("orders");
  const orderRecord = buildOrderRecord(session, userId);

  const existing = await ordersCollection.findOne({ orderId: session.id });

  if (!existing) {
    await ordersCollection.insertOne({
      ...orderRecord,
      confirmationEmailSent: false,
    });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (orderRecord.type === "hard" && existing.status === "processing") {
    updates.status = "pending_approval";
  }

  if (Object.keys(updates).length > 1) {
    await ordersCollection.updateOne({ orderId: session.id }, { $set: updates });
  }
}

export async function markBookAsOrdered(bookId: string | undefined) {
  if (!bookId) return;

  const db = await getDatabase();
  const userBooksCollection = db.collection("user_books");

  let bookQuery: any;
  try {
    bookQuery = {
      _id: bookId.length === 24 ? new ObjectId(bookId) : bookId,
    };
  } catch {
    bookQuery = { _id: bookId };
  }

  await userBooksCollection.updateOne(bookQuery, { $set: { isOrdered: true } });
}

/**
 * Sends order confirmation email once per checkout session.
 * Safe to call from both Stripe webhook and /api/check-payment.
 */
export async function sendOrderConfirmationEmailIfNeeded(
  session: StripeCheckoutSession
): Promise<boolean> {
  const db = await getDatabase();
  const ordersCollection = db.collection("orders");

  const order = await ordersCollection.findOne({ orderId: session.id });
  if (!order || order.confirmationEmailSent) {
    return false;
  }

  const email = getCustomerEmail(session) || order.email;
  if (!email) {
    console.error(`[checkout-fulfillment] No email for session ${session.id}`);
    return false;
  }

  // Claim send slot atomically to avoid duplicate emails when webhook + check-payment race
  const claim = await ordersCollection.updateOne(
    { orderId: session.id, confirmationEmailSent: { $ne: true } },
    { $set: { confirmationEmailSent: true, confirmationEmailSentAt: new Date() } }
  );
  if (claim.modifiedCount === 0) {
    return false;
  }

  const orderType = session.metadata?.orderType || order.type || "soft";
  const customerName =
    session.customer_details?.name ||
    session.shipping_details?.name ||
    email.split("@")[0] ||
    "Customer";
  const orderDate = new Date(
    (session.created || Math.floor(Date.now() / 1000)) * 1000
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const orderNumber = `#${session.id.slice(-8).toUpperCase()}`;
  const bookTitle =
    session.metadata?.templateName ||
    order.templateName ||
    "Dear Bacchanal Edition";

  try {
    if (orderType === "hard") {
      const emailHtml = getHardCopyOrderReceivedEmail({
        customerName,
        orderNumber,
        bookTemplateName: bookTitle,
        orderDate,
      });
      const result = await sendEmail({
        to: email,
        subject: "Hard Copy Order Received",
        html: emailHtml,
      });
      if (!result.success) {
        throw result.error || new Error("Hard copy email send failed");
      }
    } else {
      const amountTotal = session.amount_total ?? order.amount ?? 0;
      const pdfBuffer = await generateInvoicePDF({
        orderId: session.id,
        date: new Date(),
        customerName,
        customerEmail: email,
        amount: amountTotal / 100,
        type: orderType,
        bookTitle,
      });
      const emailHtml = getOrderConfirmationEmail({
        orderId: session.id,
        amount: amountTotal / 100,
        type: orderType,
        bookTitle,
        transactionId: session.id,
        customerName,
        customerEmail: email,
      });
      const result = await sendEmail({
        to: email,
        subject: `Your Dear Bacchanal Order Confirmation - ${orderNumber}`,
        html: emailHtml,
        attachments: [
          {
            filename: `Invoice-${session.id.slice(-8).toUpperCase()}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
      if (!result.success) {
        throw result.error || new Error("Soft copy email send failed");
      }
    }

    console.log(
      `[checkout-fulfillment] Confirmation email sent to ${email} for session ${session.id}`
    );
    return true;
  } catch (error) {
    console.error(
      `[checkout-fulfillment] Email failed for session ${session.id}, allowing retry:`,
      error
    );
    await ordersCollection.updateOne(
      { orderId: session.id },
      {
        $set: { confirmationEmailSent: false, updatedAt: new Date() },
        $unset: { confirmationEmailSentAt: "" },
      }
    );
    return false;
  }
}
