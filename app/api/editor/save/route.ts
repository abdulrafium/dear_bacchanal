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

      const updatePayload = {
        templateName: finalName,
        description: finalDesc,
        country: templateCountry || "Trinidad",
        year: templateYear || "2026",
        spreads: spreads || [],
        currentSpreadIndex: currentSpreadIndex || 0,
        updatedAt: new Date(),
        updatedBy: userId,
      };

      let templateId: string | null = null;

      // Step 1: Try to find the existing document by _id (most precise)
      let existingDoc: any = null;
      if (activeTemplateId && typeof activeTemplateId === 'string' && activeTemplateId !== "undefined" && activeTemplateId !== "preview-id" && activeTemplateId.length === 24) {
        try {
          existingDoc = await templatesCollection.findOne({ _id: new ObjectId(activeTemplateId) });
        } catch (idError) {
          console.warn("Could not parse activeTemplateId as ObjectId:", activeTemplateId);
        }
      }

      // Step 2: Fall back to looking up by name if not found by ID
      if (!existingDoc) {
        existingDoc = await templatesCollection.findOne({ templateName: finalName });
      }

      if (existingDoc) {
        // UPDATE the existing document by its real _id — no upsert, no duplicate key risk
        await templatesCollection.updateOne(
          { _id: existingDoc._id },
          { $set: updatePayload }
        );
        templateId = existingDoc._id.toString();
        console.log("Admin: updated existing global template:", templateId);
      } else {
        // INSERT a brand new template — only when truly doesn't exist
        const insertResult = await templatesCollection.insertOne({
          ...updatePayload,
          createdAt: new Date(),
          thumbnail: "/img/templates/bacchanal-classic.jpg",
        });
        templateId = insertResult.insertedId.toString();
        console.log("Admin: inserted new global template:", templateId);
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
