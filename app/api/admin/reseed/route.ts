import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getAvailableTemplates } from "@/lib/book-templates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Get the hardcoded templates from the codebase
    const templates = getAvailableTemplates();
    const bacchanalTemplate = templates.find(t => t.id === "bacchanal-2026");
    
    if (!bacchanalTemplate) {
      return NextResponse.json({ error: "Could not find bacchanal-2026 template in code" }, { status: 500 });
    }

    // Completely overwrite the global_templates collection in the DB with the pristine hardcoded spreads
    await db.collection("global_templates").updateMany(
      {},
      { $set: { spreads: bacchanalTemplate.spreads, isV2: true } }
    );

    return NextResponse.json({ message: "Successfully reseeded global templates from pristine source code" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
