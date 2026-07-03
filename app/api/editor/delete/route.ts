import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    const user = session?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing book ID" }, { status: 400 });
    }

    const db = await getDatabase();
    const userBooksCollection = db.collection("user_books");

    const query: any = { _id: new ObjectId(id) };
    const conditions: any[] = [{ userId: user.id }];
    if (user.email) conditions.push({ email: user.email });
    query.$or = conditions;

    const result = await userBooksCollection.deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Book not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Book deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
