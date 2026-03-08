import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    await db.collection("global_stickers").deleteOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({ message: "Sticker deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete sticker" }, { status: 500 });
  }
}
