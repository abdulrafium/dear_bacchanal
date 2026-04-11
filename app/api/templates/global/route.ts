import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    const templatesCollection = db.collection("global_templates");

    // Find all global templates, projecting only necessary fields
    const templates = await templatesCollection
      .find({})
      .project({ 
        templateName: 1, 
        description: 1, 
        country: 1, 
        year: 1,
        thumbnail: 1,
        createdAt: 1,
        updatedAt: 1
      })
      .sort({ updatedAt: -1 })
      .toArray();

    const formattedTemplates = templates.map(t => ({
      _id: t._id.toString(),
      name: t.templateName || "Unnamed Template",
      description: t.description || "",
      country: t.country || "Trinidad",
      year: t.year || "2026",
      thumbnail: t.thumbnail || "/img/templates/bacchanal-classic.jpg",
      active: t.active !== undefined ? t.active : true, // Explicitly include active field
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({ templates: formattedTemplates }, { status: 200 });
  } catch (error) {
    console.error("Error fetching global templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
