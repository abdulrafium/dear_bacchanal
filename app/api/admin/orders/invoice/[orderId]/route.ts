import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";
import { ObjectId } from "mongodb";
import { stripe } from "@/lib/stripe";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const user = await getServerAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const db = await getDatabase();
    const ordersCollection = db.collection("orders");
    
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // AUTH CHECK: Admin or Order Owner
    if (!user.isAdmin && order.userId?.toString() !== user.id) {
       return NextResponse.json({ error: "Unauthorized access to this receipt" }, { status: 403 });
    }

    // ── Backfill paymentIntentId for orders that pre-date this feature ──────────
    // If the order doesn't have a paymentIntentId yet, fetch it live from Stripe
    // using the stored Checkout Session ID and save it permanently to the DB.
    let paymentIntentId = order.paymentIntentId || null;
    if (!paymentIntentId && order.orderId?.startsWith("cs_")) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.orderId);
        const pi = session.payment_intent;
        paymentIntentId = typeof pi === "string" ? pi : (pi as any)?.id || null;
        if (paymentIntentId) {
          // Persist so we never call Stripe again for this order
          await ordersCollection.updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { paymentIntentId } }
          );
          console.log(`[invoice] Backfilled paymentIntentId=${paymentIntentId} for order ${orderId}`);
        }
      } catch (stripeErr) {
        console.warn("[invoice] Could not fetch payment intent from Stripe:", stripeErr);
      }
    }

    const settings = await db.collection("settings").findOne({ id: "platform_settings" });
    const hardBaseCents = settings?.pricing?.hardCopyPrice || 5000;

    let bookAmountCents = order.amount;
    let shippingAmountCents = 0;

    if (order.type === 'hard') {
      if (order.shippingFee) {
        shippingAmountCents = order.shippingFee;
        bookAmountCents = Math.max(0, order.amount - shippingAmountCents);
      } else if (order.amount > hardBaseCents) {
        shippingAmountCents = order.amount - hardBaseCents;
        bookAmountCents = hardBaseCents;
      } else {
        const countryCode = order.shippingDetails?.address?.country;
        const countryObj = settings?.countries?.find((c: any) => c.code?.toUpperCase() === countryCode?.toUpperCase());
        if (countryObj && countryObj.shippingRate) {
          shippingAmountCents = countryObj.shippingRate;
          bookAmountCents = Math.max(0, order.amount - shippingAmountCents);
        }
      }
    }

    const subtotal = bookAmountCents / 100;
    const shippingFee = shippingAmountCents / 100;
    const total = order.amount / 100;

    // Resolve phone and postalCode from our custom form data (stored in order.shippingAddress JSON)
    let parsedShippingAddress: any = {};
    if (order.shippingAddress) {
      try {
        parsedShippingAddress = typeof order.shippingAddress === 'string'
          ? JSON.parse(order.shippingAddress)
          : order.shippingAddress;
      } catch {}
    }
    const phone = order.phone || parsedShippingAddress?.phone || order.shippingDetails?.phone || null;
    const postalCode = parsedShippingAddress?.postalCode || order.shippingDetails?.address?.postal_code || parsedShippingAddress?.postal_code || null;

    // Generate a clean numeric transaction reference from the MongoDB ObjectId.
    // ObjectId encodes creation timestamp in its first 4 bytes — gives us a
    // deterministic, unique, purely-numeric ID like a bank slip reference.
    const objectIdHex = order._id.toString(); // 24-char hex
    const tsSeconds = parseInt(objectIdHex.slice(0, 8), 16);          // unix timestamp (secs)
    const counterPart = parseInt(objectIdHex.slice(-6), 16) % 1000000; // 0-999999
    const transactionRef = `${tsSeconds}${String(counterPart).padStart(6, '0')}`; // e.g. "172365123400042"

    // Return structured data for the invoice UI
    const invoiceData = {
      invoiceNumber: `INV-${order.orderId?.slice(-6).toUpperCase() || objectIdHex.slice(-6).toUpperCase()}`,
      transactionId: paymentIntentId || order.orderId || null,   // raw Stripe ID (kept for reference)
      transactionRef,   // clean numeric bank-style reference (e.g. "172365123400042")
      date: order.createdAt,
      type: order.type || "soft",
      templateName: order.templateName || "Custom Template",
      customer: {
        name: order.customerName || order.shippingDetails?.name || order.email?.split('@')[0] || "Valued Customer",
        email: order.email,
        phone: phone,
        address: {
          ...(order.shippingDetails?.address || {
            line1: "Digital Delivery",
            city: "N/A",
            state: "N/A",
            postal_code: "N/A",
            country: "WW"
          }),
          postal_code: postalCode || order.shippingDetails?.address?.postal_code || "N/A",
        }
      },
      items: [
        {
          description: `Dear Bacchanal - ${order.type === 'hard' ? 'Hardcover Heirloom Edition' : 'Digital PDF Edition'}`,
          quantity: 1,
          unitPrice: subtotal,
          total: subtotal
        }
      ],
      subtotal: subtotal,
      shippingFee: shippingFee,
      processing: shippingFee,
      tax: 0,
      total: total,
      currency: order.currency?.toUpperCase() || "USD",
      status: order.status,
      paymentMethod: order.paymentMethod || "card"
    };

    return NextResponse.json(invoiceData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
