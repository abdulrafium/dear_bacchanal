import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { stripe } from "@/lib/stripe";

// POST - Sync all Stripe completed checkout sessions into orders collection
export async function POST(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    const ordersCollection = db.collection("orders");

    let synced = 0;
    let skipped = 0;
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    // Paginate through ALL Stripe checkout sessions
    while (hasMore) {
      const params: any = {
        limit: 100,
        status: 'complete',
      };
      if (startingAfter) {
        params.starting_after = startingAfter;
      }

      const sessions = await stripe.checkout.sessions.list(params);

      for (const session of sessions.data) {
        // Only process paid sessions
        if (session.payment_status !== 'paid') {
          skipped++;
          continue;
        }

        // Check if order already exists
        const existing = await ordersCollection.findOne({ orderId: session.id });
        if (existing) {
          skipped++;
          continue;
        }

        // Extract info from the session
        const metadata = session.metadata || {};
        const email = session.customer_email || (session.customer_details as any)?.email || '';
        const customerName = (session.customer_details as any)?.name || email?.split('@')[0] || '';
        const orderType = metadata.orderType || 'soft';

        const orderRecord = {
          userId: metadata.userId || null,
          email: email,
          orderId: session.id,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          type: orderType,
          templateName: metadata.templateName || '',
          bookId: metadata.bookId || '',
          status: orderType === 'hard' ? 'pending_approval' : 'paid',
          shippingDetails: (session as any).shipping_details || null,
          paymentMethod: session.payment_method_types?.[0] || 'card',
          customerName: customerName,
          createdAt: new Date((session.created || 0) * 1000),
          updatedAt: new Date(),
          syncedFromStripe: true,
        };

        await ordersCollection.insertOne(orderRecord);
        synced++;

        // Send order received email for newly synced hard copy orders
        if (orderType === 'hard') {
           try {
             const { sendEmail } = require("@/lib/mail-service");
             const { getHardCopyOrderReceivedEmail } = require("@/lib/email-templates");
             let emailToSendTo = email;

             if (metadata.userId) {
                const usersCollection = db.collection("users");
                const { ObjectId } = require("mongodb");
                const query = ObjectId.isValid(metadata.userId) ? { _id: new ObjectId(metadata.userId) } : { email: emailToSendTo };
                const user = await usersCollection.findOne(query);
                if (user?.email) {
                    emailToSendTo = user.email;
                }
             }

             const orderDate = new Date((session.created || 0) * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
             });
             const orderNumber = `#${session.id.slice(-8).toUpperCase()}`;

             const emailHtml = getHardCopyOrderReceivedEmail({
                customerName,
                orderNumber,
                bookTemplateName: metadata.templateName || "Dear Bacchanal Edition",
                orderDate,
             });

             await sendEmail({
                to: emailToSendTo,
                subject: "Hard Copy Order Received",
                html: emailHtml,
             });
             console.log(`[sync-stripe] Sent order received email to ${emailToSendTo}`);
           } catch (e) {
             console.error("[sync-stripe] Failed to send order received email", e);
           }
        }
      }

      hasMore = sessions.has_more;
      if (sessions.data.length > 0) {
        startingAfter = sessions.data[sessions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      message: `Synced ${synced} new orders from Stripe. ${skipped} already existed or were incomplete.`,
    });
  } catch (error: any) {
    console.error("Stripe sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
