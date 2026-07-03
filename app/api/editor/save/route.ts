import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuth();

    if (!user && process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user?.id || user?.email || "anonymous-dev-user";
    const body = await req.json();
    console.log("Save request received from user:", userId, "isAdmin:", body.isAdmin);

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
      
      let query: any = { templateName: finalName };
      
      // Use ID if available for precision and to allow renaming. Only use 24-char ObjectIds.
      if (activeTemplateId && typeof activeTemplateId === 'string' && activeTemplateId !== "undefined" && activeTemplateId !== "preview-id") {
        try {
          if (activeTemplateId.length === 24) {
            query = { _id: new ObjectId(activeTemplateId) };
          }
          // Intentionally do NOT use hardcoded string IDs like "bacchanal-2026" as they cause E11000 dup key errors
        } catch (idError) {
          console.error("Invalid template ID format:", activeTemplateId);
          // Fallback to name-based query if ID is invalid
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

      // CRITICAL: Ensure we return the ID after an update OR an insert
      let templateId = result.upsertedId ? result.upsertedId.toString() : null;
      if (!templateId) {
        // If it was an update, we need to find the ID of the document we updated
        const existing = await templatesCollection.findOne(query, { projection: { _id: 1 } });
        if (existing) templateId = existing._id.toString();
      }

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
      
      let templateId: string | null = null;
      let bookQuery: any = null;
      if (activeTemplateId && typeof activeTemplateId === 'string' && activeTemplateId !== "undefined") {
        try {
          // Query strictly by _id for precision.
          bookQuery = { _id: new ObjectId(activeTemplateId) };
        } catch (e) {
          console.error("Invalid activeTemplateId during user save:", activeTemplateId);
        }
      }
      
      if (bookQuery) {
        // Update existing specific book
        await userBooksCollection.updateOne(
          bookQuery,
          {
            $set: {
              userId, // Transfer ownership to current user (handles guest -> logged in transition)
              spreads: spreads || [],
              activeTemplateName: activeTemplateName || "Untitled Book",
              templateDescription: finalDesc,
              templateCountry,
              templateYear,
              currentSpreadIndex: currentSpreadIndex || 0,
              totalImages,
              updatedAt: new Date()
            },
            $setOnInsert: {
              email: user?.email,
              createdAt: new Date()
            }
          },
          { upsert: true }
        );
        templateId = activeTemplateId;
      } else {
        // THIS IS A BRAND NEW BOOK (fresh=true or no ID provided)
        // ALWAYS insert a new document! Never overwrite by name!
        const insertResult = await userBooksCollection.insertOne({
          userId,
          email: user?.email,
          spreads: spreads || [],
          activeTemplateName: activeTemplateName || "Untitled Book",
          templateDescription: finalDesc,
          templateCountry,
          templateYear,
          currentSpreadIndex: currentSpreadIndex || 0,
          totalImages,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        templateId = insertResult.insertedId.toString();
      }
      
      return NextResponse.json({ 
        message: "Book saved successfully!", 
        templateId 
      }, { status: 200 });
    }
  } catch (error: any) {
    console.error("CRITICAL SAVE ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during save" },
      { status: 500 }
    );
  }
}
