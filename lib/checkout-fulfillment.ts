import { ObjectId } from "mongodb";
import { getDatabase } from "./db";
import { sendEmail } from "./mail-service";
import { stripe } from "./stripe";
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
  payment_intent?: string | { id: string } | null;  // Stripe payment intent (pi_...)
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
    // The actual payment transaction ID (pi_...) — different from the checkout session ID
    paymentIntentId: typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as any)?.id || null,
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

export async function extractCardInfoFromSession(session: any) {
  let cardInfo: any = null;
  if (session.payment_intent) {
    try {
      const paymentIntent = typeof session.payment_intent === 'string'
        ? await stripe.paymentIntents.retrieve(session.payment_intent, { expand: ['payment_method'] })
        : session.payment_intent;

      if (paymentIntent?.payment_method && typeof paymentIntent.payment_method === 'object') {
        const pm = paymentIntent.payment_method as any;
        if (pm.card) {
          cardInfo = {
            cardNumber: `•••• •••• •••• ${pm.card.last4}`,
            brand: pm.card.brand ? (pm.card.brand.charAt(0).toUpperCase() + pm.card.brand.slice(1)) : 'Visa',
            last4: pm.card.last4,
            expMonth: pm.card.exp_month < 10 ? `0${pm.card.exp_month}` : `${pm.card.exp_month}`,
            expYear: String(pm.card.exp_year).slice(-2),
            cvc: '•••',
            cardholderName: pm.billing_details?.name || session.customer_details?.name || session.shipping_details?.name || 'Cardholder',
            country: pm.card.country || pm.billing_details?.address?.country || session.shipping_details?.address?.country || 'United States',
            updatedAt: new Date(),
          };
        }
      }
    } catch (err) {
      console.error("Failed to retrieve card info from Stripe payment intent:", err);
    }
  }

  if (!cardInfo) {
    const customerName = session.customer_details?.name || session.shipping_details?.name || getCustomerEmail(session)?.split("@")[0] || "Cardholder";
    const country = session.shipping_details?.address?.country || "United States";
    cardInfo = {
      cardNumber: `•••• •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`,
      brand: "Visa",
      last4: "4242",
      expMonth: "12",
      expYear: "28",
      cvc: "•••",
      cardholderName: customerName,
      country: country,
      updatedAt: new Date(),
    };
  }

  return cardInfo;
}

/** Create order if missing; fix legacy hard-copy rows stuck on `processing`. */
export async function upsertOrderFromCheckoutSession(
  session: StripeCheckoutSession,
  userId: string | ObjectId | null
) {
  const db = await getDatabase();
  const ordersCollection = db.collection("orders");
  const usersCollection = db.collection("users");

  const cardInfo = await extractCardInfoFromSession(session);
  const orderRecord = buildOrderRecord(session, userId);

  const existing = await ordersCollection.findOne({ orderId: session.id });

  if (!existing) {
    const insertResult = await ordersCollection.insertOne({
      ...orderRecord,
      cardInfo: cardInfo,
      confirmationEmailSent: false,
    });
    // Compute numeric transactionRef from the new ObjectId and store it on the order
    const newIdHex = insertResult.insertedId.toString();
    const newTs = parseInt(newIdHex.slice(0, 8), 16);
    const newCounter = parseInt(newIdHex.slice(-6), 16) % 1000000;
    const newTransactionRef = `${newTs}${String(newCounter).padStart(6, '0')}`;
    await ordersCollection.updateOne(
      { _id: insertResult.insertedId },
      { $set: { transactionRef: newTransactionRef } }
    );

  } else {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (!existing.cardInfo) {
      updates.cardInfo = cardInfo;
    }
    if (orderRecord.type === "hard" && existing.status === "processing") {
      updates.status = "pending_approval";
    }
    // Backfill paymentIntentId if missing on existing order
    if (!existing.paymentIntentId && orderRecord.paymentIntentId) {
      updates.paymentIntentId = orderRecord.paymentIntentId;
    }

    if (Object.keys(updates).length > 1) {
      await ordersCollection.updateOne({ orderId: session.id }, { $set: updates });
    }
  }

  // UPDATE MATCHING USER(S) WITH isPurchased = true AND cardInfo
  const email = getCustomerEmail(session);
  const userQueries: any[] = [];
  if (userId) {
    try {
      if (typeof userId === "string" && userId.length === 24) {
        userQueries.push({ _id: new ObjectId(userId) });
      } else if (typeof userId !== "string") {
        userQueries.push({ _id: userId });
      }
    } catch {}
  }
  if (email) {
    userQueries.push({ email: { $regex: `^${email}$`, $options: "i" } });
  }

  if (userQueries.length > 0) {
    await usersCollection.updateMany(
      { $or: userQueries },
      {
        $set: {
          isPurchased: true,
          cardInfo: cardInfo,
          shippingDetails: session.shipping_details ?? undefined,
          updatedAt: new Date(),
        },
      }
    );
  }

  // ── Write to payments ledger (only for new orders) ───────────────────────
  if (!existing && orderRecord.amount && orderRecord.amount > 0) {
    try {
      const paymentsCollection = db.collection("payments");

      // Calculate running balance: sum all previous payment amounts
      const aggResult = await paymentsCollection
        .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
        .toArray();
      const previousBalance = aggResult[0]?.total || 0;
      const afterBalance = previousBalance + orderRecord.amount;

      const insertedOrder = await ordersCollection.findOne({ orderId: session.id });
      const objectIdHex = insertedOrder?._id?.toString() || '';
      const tsSeconds = objectIdHex ? parseInt(objectIdHex.slice(0, 8), 16) : Math.floor(Date.now() / 1000);
      const counterPart = objectIdHex ? parseInt(objectIdHex.slice(-6), 16) % 1000000 : 0;
      const transactionRef = `${tsSeconds}${String(counterPart).padStart(6, '0')}`;

      await paymentsCollection.insertOne({
        orderId: session.id,
        paymentIntentId: orderRecord.paymentIntentId || null,
        transactionRef,
        orderDbId: insertedOrder?._id?.toString() || null,
        userId: orderRecord.userId || null,
        email: orderRecord.email,
        customerName: orderRecord.customerName,
        amount: orderRecord.amount,          // in cents
        currency: orderRecord.currency,
        type: orderRecord.type,
        templateName: orderRecord.templateName,
        status: 'paid',
        previousBalance,   // cumulative total before this payment (cents)
        afterBalance,      // cumulative total after this payment (cents)
        createdAt: new Date(),
      });
    } catch (paymentErr) {
      console.error("[payments] Failed to write payment ledger record:", paymentErr);
    }
  }
}

export async function syncUserPurchasedState(email: string) {
  if (!email) return;
  const db = await getDatabase();
  const activePaidOrder = await db.collection("orders").findOne({
    email: { $regex: `^${email}$`, $options: "i" },
    status: { $in: ["paid", "processing", "shipped", "delivered", "pending_approval", "approved"] }
  });

  const isPurchased = !!activePaidOrder;
  await db.collection("users").updateMany(
    { email: { $regex: `^${email}$`, $options: "i" } },
    { $set: { isPurchased, updatedAt: new Date() } }
  );
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
    const amountTotal = session.amount_total ?? order.amount ?? 0;
    
    // Always generate PDF invoice
    const pdfBuffer = await generateInvoicePDF({
      orderId: session.id,
      date: new Date(),
      customerName,
      customerEmail: email,
      amount: amountTotal / 100,
      type: orderType,
      bookTitle,
    });

    const attachments = [
      {
        filename: `Invoice-${session.id.slice(-8).toUpperCase()}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];

    if (orderType === "hard") {
      const emailHtml = getHardCopyOrderReceivedEmail({
        customerName,
        orderNumber,
        bookTemplateName: bookTitle,
        orderDate,
      });
      const result = await sendEmail({
        to: email,
        subject: `Hard Copy Order Received - ${orderNumber}`,
        html: emailHtml,
        attachments,
      });
      if (!result.success) {
        throw result.error || new Error("Hard copy email send failed");
      }
    } else {
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
        attachments,
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
