import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id && !session?.user?.email) {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
    }

    const userId = session?.user?.id || session?.user?.email || "anonymous-dev-user";
    const body = await req.json();
    const { isAdmin, activeTemplateId, spreads, activeTemplateName, templateDescription, templateCountry, templateYear, currentSpreadIndex } = body;
    const finalName = (activeTemplateName && activeTemplateName !== "undefined") ? activeTemplateName : "New Template";
    const finalDesc = (templateDescription && templateDescription !== "undefined") ? templateDescription : "Custom template created via editor";
    const finalCountry = templateCountry || "Unknown";
    const finalYear = templateYear || "2026";

    const db = await getDatabase();
    
    // Check if user is actually an admin from session, not just request body
    const isUserAdmin = session?.user?.isAdmin || (process.env.NODE_ENV === "development");

    if (isUserAdmin && isAdmin) {
      // Save to global templates
      const templatesCollection = db.collection("global_templates");
      
      let query: any = { templateName: finalName };
      
      // If we have an ID, use it for precision and to allow renaming
      if (activeTemplateId && activeTemplateId !== "undefined") {
        try {
          const { ObjectId } = await import('mongodb');
          query = { _id: new ObjectId(activeTemplateId) };
        } catch (e) {
          // If ID is not a valid ObjectId (e.g. hardcoded string), fallback to name
          query = { templateName: finalName };
        }
      }

      const result = await templatesCollection.updateOne(
        query,
        {
          $set: {
            templateName: finalName,
            description: finalDesc,
            country: finalCountry,
            year: finalYear,
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

      return NextResponse.json({ 
        message: "Template saved successfully!", 
        templateId: result.upsertedId ? result.upsertedId.toString() : (query._id ? query._id.toString() : null)
      }, { status: 200 });
    } else {
      // Save to user books
      const userBooksCollection = db.collection("user_books");
      await userBooksCollection.updateOne(
        { userId },
        {
          $set: {
            spreads: spreads || [],
            activeTemplateName: activeTemplateName || null,
            currentSpreadIndex: currentSpreadIndex || 0,
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
