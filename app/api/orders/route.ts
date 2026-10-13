import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    // Fetch orders for this user by matching their userId or their email
    const orders = await db.collection("orders")
      .find({ 
        $or: [
          { userId: user.id },
          { email: user.email }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich each order with the actual page count of the customer's book
    const enrichedOrders = await Promise.all(orders.map(async (order) => {
      let pageCount = order.pagesCount || order.pageCount || null;

      if (!pageCount && order.bookId) {
        let book = null;
        if (ObjectId.isValid(order.bookId) && order.bookId.length === 24) {
          book = await db.collection("user_books").findOne({ _id: new ObjectId(order.bookId) });
        }
        if (!book) {
          book = await db.collection("user_books").findOne({ id: order.bookId });
        }
        if (!book && order.templateName) {
          book = await db.collection("global_templates").findOne({ name: order.templateName });
        }

        if (book?.spreads && Array.isArray(book.spreads) && book.spreads.length > 0) {
          // Each spread has 2 pages (left and right)
          pageCount = book.spreads.length * 2;
        }
      }

      if (!pageCount) {
        // Standard Carnival Book has 17 spreads = 34 pages
        pageCount = 34;
      }

      return {
        ...order,
        pagesCount: pageCount,
      };
    }));

    // Fetch dynamic refund policy settings from DB
    const settings = await db.collection("settings").findOne({ id: "platform_settings" });
    const taxPercentage = settings?.pricing?.taxPercentage ?? settings?.pricing?.refundDeductionPercentage ?? 20;
    const refundDeadlineDays = settings?.general?.refundDeadlineDays ?? 14;

    return NextResponse.json({
      orders: enrichedOrders,
      refundPolicy: {
        taxPercentage: Number(taxPercentage),
        refundDeductionPercentage: Number(taxPercentage),
        refundDeadlineDays: Number(refundDeadlineDays),
      }
    });
  } catch (error: any) {
    console.error("Fetch orders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
