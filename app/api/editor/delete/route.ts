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

    const result = await userBooksCollection.deleteOne({
      _id: new ObjectId(id),
      $or: [
        { userId: user.id },
        { email: user.email }
      ]
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Book not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Book deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting book:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
