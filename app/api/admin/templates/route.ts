import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export const revalidate = 300; // Cache for 5 minutes to fix editor latency

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
    if (!id && !templateName) return NextResponse.json({ error: "ID or templateName is required" }, { status: 400 });

    const db = await getDatabase();
    
    const update: any = {};
    if (templateName !== undefined) update.templateName = templateName;
    if (country !== undefined) update.country = country;
    if (year !== undefined) update.year = year;
    update.updatedAt = new Date();

    const { ObjectId } = await import('mongodb');
    let query: any = { _id: id };
    
    // Try to use templateName as fallback or if id is not an ObjectId
    try {
      if (typeof id === 'string' && id.length === 24) {
        query = { _id: new ObjectId(id) };
      } else if (templateName) {
        // Find existing by name if ID isn't a valid ObjectId
        const existing = await db.collection("global_templates").findOne({ 
          $or: [{ templateName: templateName }, { name: templateName }] 
        });
        if (existing) {
          query = { _id: existing._id };
        } else if (typeof id === 'string' && id.length > 0) {
          query = { _id: id }; // Use string ID as-is (e.g. "bacchanal-2026")
        }
      }
    } catch (e) {
      console.error("Query buildup error:", e);
    }

    const result = await db.collection("global_templates").updateOne(
      query,
      { $set: update },
      { upsert: true }
    );

    console.log("Template update result:", { query, update, matched: result.matchedCount, upserted: result.upsertedId });

    return NextResponse.json({ 
      message: "Template updated successfully", 
      id: result.upsertedId || id 
    });
  } catch (error) {
    console.error("Error updating template:", error);
    return NextResponse.json({ error: "Error updating template" }, { status: 500 });
  }
}
