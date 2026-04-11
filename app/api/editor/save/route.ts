import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuth(req);

    if (!user && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user?.id || user?.email || "anonymous-dev-user";
    const body = await req.json();
    const { 
      isAdmin, 
      spreads, 
      activeTemplateId,
      activeTemplateName, 
      templateDescription, 
      templateCountry,
      templateYear,
      currentSpreadIndex 
    } = body;
    
    const finalName = (activeTemplateName && activeTemplateName !== "undefined") ? activeTemplateName : "New Template";
    const finalDesc = (templateDescription && templateDescription !== "undefined") ? templateDescription : "Custom template created via editor";

    const db = await getDatabase();

    if (isAdmin) {
      // Save to global templates
      const templatesCollection = db.collection("global_templates");
      
      const { ObjectId } = await import('mongodb');
      let query: any = { templateName: finalName };
      
      // Use ID if available for precision and to allow renaming
      if (activeTemplateId && typeof activeTemplateId === 'string') {
        if (activeTemplateId.length === 24) {
          query = { _id: new ObjectId(activeTemplateId) };
        } else {
          query = { _id: activeTemplateId }; // Hardcoded string ID
        }
      }

      const result = await templatesCollection.updateOne(
        query,
        {
          $set: {
            templateName: finalName,
            description: finalDesc,
            country: templateCountry || "Trinidad",
            year: templateYear || "2026",
            spreads: spreads || [],
            currentSpreadIndex: currentSpreadIndex || 0,
            updatedAt: new Date(),
            updatedBy: userId,
          },
          $setOnInsert: {
            createdAt: new Date(),
            thumbnail: "/img/templates/bacchanal-classic.jpg",
          },
        },
        { upsert: true }
      );

      const templateId = result.upsertedId || (query._id ? query._id.toString() : null);

      return NextResponse.json({ 
        message: "Template saved successfully!", 
        templateId 
      }, { status: 200 });
    } else {
      // Calculate some statistics for fast metadata-only loading later
      const totalImages = (spreads || []).reduce((acc: number, s: any) => {
        return acc + (s.leftPage?.elements?.filter((e: any) => e.type === "image" || e.type === "sticker").length || 0)
                   + (s.rightPage?.elements?.filter((e: any) => e.type === "image" || e.type === "sticker").length || 0);
      }, 0);

      // Save to user books
      const userBooksCollection = db.collection("user_books");
      await userBooksCollection.updateOne(
        { userId },
        {
          $set: {
            spreads: spreads || [],
            activeTemplateName: activeTemplateName || null,
            currentSpreadIndex: currentSpreadIndex || 0,
            imageCount: totalImages,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({ message: "Book saved successfully!" }, { status: 200 });
    }
  } catch (error) {
    console.error("Error saving data:", error);
    return NextResponse.json(
      { error: "Failed to save" },
      { status: 500 }
    );
  }
}
