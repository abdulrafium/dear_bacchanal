import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const session = await auth();

    // In a real app check for role === "admin"
    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    const templatesCollection = db.collection("global_templates");

    const templates = await templatesCollection.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin templates:", error);
    return NextResponse.json({ error: "Error fetching" }, { status: 500 });
  }
}
