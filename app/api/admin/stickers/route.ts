export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

import { getDatabase } from "@/lib/db";

import { auth } from "@/lib/auth";


export async function GET() {
  try {
    const db = await getDatabase();
    const stickersCollection = db.collection("global_stickers");
    const stickers = await stickersCollection.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ stickers }, { status: 200 });
  } catch (error) {
    console.error("Error fetching stickers:", error);
    return NextResponse.json({ error: "Error fetching" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.isAdmin || process.env.NODE_ENV === "development";
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, name } = await req.json();
    const db = await getDatabase();
    
    const result = await db.collection("global_stickers").insertOne({
      url,
      name: name || "Untitled Sticker",
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Sticker added", sticker: { _id: result.insertedId, url, name } }, { status: 200 });
  } catch (error) {
    console.error("Error adding sticker:", error);
    return NextResponse.json({ error: "Failed to add sticker" }, { status: 500 });
  }
}


