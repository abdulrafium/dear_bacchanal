import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // No auth check for GET - anyone (even guests) can see global templates
    const db = await getDatabase();
    const templatesCollection = db.collection("global_templates");

    const templates = await templatesCollection.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ templates }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin templates:", error);
    return NextResponse.json({ error: "Error fetching" }, { status: 500 });
  }
}
export async function PATCH(req: Request) {
  try {
    const session = await auth();
    const isAdmin = session?.user?.isAdmin || (process.env.NODE_ENV === "development");
    if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, templateName, country, year } = await req.json();
    if (!id) return NextResponse.json({ error: "ID is required" }, { status: 400 });

    const db = await getDatabase();
    
    const update: any = {};
    if (templateName !== undefined) update.templateName = templateName;
    if (country !== undefined) update.country = country;
    if (year !== undefined) update.year = year;
    update.updatedAt = new Date();

    const { ObjectId } = await import('mongodb');
    let query = { _id: id } as any;
    try {
      if (typeof id === 'string' && id.length === 24) {
        query = { _id: new ObjectId(id) };
      }
    } catch (e) {}

    await db.collection("global_templates").updateOne(
      query,
      { $set: update }
    );

    return NextResponse.json({ message: "Template updated successfully" });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Error updating template" }, { status: 500 });
  }
}
