import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ templateName: string }> }
) {
  try {
    const { templateName } = await params;
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDatabase();
    await db.collection("global_templates").deleteOne({ templateName: decodeURIComponent(templateName) });

    return NextResponse.json({ message: "Template deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ templateName: string }> }
) {
  try {
    const { templateName } = await params;
    const decodedName = decodeURIComponent(templateName);
    const session = await auth();
    const isAdmin = session?.user?.isAdmin || (process.env.NODE_ENV === "development");
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isActive } = await req.json();
    console.log(`Updating template status: "${decodedName}" -> ${isActive}`);
    
    const db = await getDatabase();
    const templatesCollection = db.collection("global_templates");

    // Escape decodedName for regex
    const escapedName = decodedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Case-insensitive check and find existing
    const existing = await templatesCollection.findOne({
      templateName: { $regex: new RegExp(`^${escapedName}$`, "i") }
    });

    if (existing) {
      console.log(`Found existing template in DB: "${existing.templateName}" (_id: ${existing._id})`);
      const result = await templatesCollection.updateOne(
        { _id: existing._id },
        { $set: { isActive, updatedAt: new Date() } }
      );
      if (!result.acknowledged) {
        throw new Error("Database update not acknowledged");
      }
    } else {
      console.log(`Template not in DB, creating from defaults: "${decodedName}"`);
      // First time activating a hardcoded template - need to upsert with full data
      const { getAvailableTemplates } = await import("@/lib/book-templates");
      const hardcoded = getAvailableTemplates().find(t => t.name.toLowerCase() === decodedName.toLowerCase());
      
      const updateData: any = {
        templateName: decodedName,
        isActive,
        updatedAt: new Date(),
        createdAt: new Date(),
        thumbnail: hardcoded?.thumbnail || "/img/templates/bacchanal-classic.jpg",
        description: hardcoded?.description || "Carnival themed template",
        country: hardcoded?.country || "Trinidad",
        year: hardcoded?.year || "2026",
        spreads: hardcoded?.spreads || [],
      };

      const result = await templatesCollection.updateOne(
        { templateName: decodedName },
        { 
          $set: updateData,
          $setOnInsert: { _id: decodedName } // Use decodedName or hardcoded ID as _id
        },
        { upsert: true }
      );
      if (!result.acknowledged) {
        throw new Error("Database upsert not acknowledged");
      }
    }

    return NextResponse.json({ message: "Template status updated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to update template status:", error);
    return NextResponse.json({ 
      error: "Failed to update template status", 
      details: error.message 
    }, { status: 500 });
  }
}
