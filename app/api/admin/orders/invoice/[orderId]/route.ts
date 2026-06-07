import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";
import { ObjectId } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const user = await getServerAuth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = params;
    const db = await getDatabase();
    
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // AUTH CHECK: Admin or Order Owner
    if (!user.isAdmin && order.userId?.toString() !== user.id) {
       return NextResponse.json({ error: "Unauthorized access to this receipt" }, { status: 403 });
    }

    // Return structured data for the invoice UI
    const invoiceData = {
      invoiceNumber: `INV-${order.orderId?.slice(-6).toUpperCase() || order._id.toString().slice(-6).toUpperCase()}`,
      date: order.createdAt,
      customer: {
        name: order.shippingDetails?.name || order.email || "Valued Customer",
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
          unitPrice: order.amount / 100,
          total: order.amount / 100
        }
      ],
      subtotal: order.amount / 100,
      tax: 0,
      total: order.amount / 100,
      currency: order.currency?.toUpperCase() || "USD",
      status: order.status,
      paymentMethod: order.paymentMethod
    };

    return NextResponse.json(invoiceData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
