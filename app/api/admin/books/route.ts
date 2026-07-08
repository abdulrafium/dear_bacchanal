import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuth();
    
    // Check if the user is an admin
    const isAdmin = user?.email === "admin@dearbacchanal.com" || process.env.NODE_ENV === "development";
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const userBooksCollection = db.collection("user_books");
    
    // Fetch all user books, sorted by most recently updated
    const books = await userBooksCollection.find({}).sort({ updatedAt: -1 }).toArray();
    
    return NextResponse.json({ books }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user books:", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}
