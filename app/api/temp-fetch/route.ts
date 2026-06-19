import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const db = await getDatabase();
    const orderId = "6a33e8c043d78e352aee4387";
    const order = await db.collection("orders").findOne({ _id: new ObjectId(orderId) });
    
    if (order) {
      const book = await db.collection("user_books").findOne({ _id: new ObjectId(order.bookId) });
      return NextResponse.json({ bookId: order.bookId, savedPdfUrl: book?.savedPdfUrl });
    }
    
    return NextResponse.json({ error: "Not found" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
