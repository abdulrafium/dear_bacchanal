import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { templateName: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    await db.collection("global_templates").deleteOne({ templateName: decodeURIComponent(params.templateName) });

    return NextResponse.json({ message: "Template deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { templateName: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isActive } = await req.json();
    const db = await getDatabase();

    await db.collection("global_templates").updateOne(
      { templateName: decodeURIComponent(params.templateName) },
      { $set: { isActive } }
    );

    return NextResponse.json({ message: "Template updated" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
