import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";
import { ObjectId } from "mongodb";

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
    
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // AUTH CHECK: Admin or Order Owner
    if (!user.isAdmin && order.userId?.toString() !== user.id) {
       return NextResponse.json({ error: "Unauthorized access to this receipt" }, { status: 403 });
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

    // Return structured data for the invoice UI
    const invoiceData = {
      invoiceNumber: `INV-${order.orderId?.slice(-6).toUpperCase() || order._id.toString().slice(-6).toUpperCase()}`,
      date: order.createdAt,
      type: order.type || "soft",
      templateName: order.templateName || "Custom Template",
      customer: {
        name: order.customerName || order.shippingDetails?.name || order.email?.split('@')[0] || "Valued Customer",
        email: order.email,
        address: order.shippingDetails?.address || {
            line1: "Digital Delivery",
            city: "N/A",
            state: "N/A",
            postal_code: "N/A",
            country: "WW"
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
