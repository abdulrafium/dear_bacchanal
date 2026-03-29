import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const isAdmin = session?.user?.isAdmin || process.env.NODE_ENV === "development";
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    await db.collection("global_stickers").deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({ message: "Sticker deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete sticker" }, { status: 500 });
  }
}
