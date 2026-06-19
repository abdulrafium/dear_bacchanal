import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// GET - Retrieve all saved templates for the current user
export async function GET(req: NextRequest) {
  try {
    const user = await getServerAuth();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const db = await getDatabase();
    const userBooksCollection = db.collection("user_books");

    // Find all user books matching userId or email
    const templates = await userBooksCollection
      .find({ 
        $or: [
          { userId },
          { email: user.email }
        ],
        isOrdered: { $ne: true }
      })
      .project({ 
        activeTemplateName: 1, 
        createdAt: 1, 
        updatedAt: 1, 
        imageCount: 1 
      })
      .sort({ updatedAt: -1 })
      .toArray();

    // Deduplicate: if multiple books share the same name (can happen due to race conditions
    // in past saves), only return the most recently updated one per name.
    const seen = new Map<string, any>();
    for (const t of templates) {
      const key = (t.activeTemplateName || "My Carnival Book").toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, t);
      }
    }
    const deduplicated = Array.from(seen.values());

    // Map the internal structure to the Template interface the frontend expects
    const formattedTemplates = deduplicated.map(t => ({
      _id: t._id.toString(),
      bookName: t.activeTemplateName || "My Carnival Book",
      imageCount: t.imageCount || 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json({ templates: formattedTemplates }, { status: 200 });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST - Save a new book template
export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuth();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to save your book." },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await req.json();
    const { bookName, images, textData } = body;

    if (!bookName) {
      return NextResponse.json(
        { error: "Book name is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const userBooksCollection = db.collection("user_books");

    // Update or create the user's single book template (upsert)
    const result = await userBooksCollection.updateOne(
      { userId }, // Find by userId
      {
        $set: {
          bookName,
          images: images || {},
          textData: textData || {},
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId,
          createdAt: new Date(),
        },
      },
      { upsert: true } // Create if doesn't exist, update if exists
    );

    return NextResponse.json(
      {
        message: result.matchedCount > 0
          ? "Book updated successfully!"
          : "Book saved successfully!",
        templateId: result.upsertedId?.toString() || "updated",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving template:", error);
    return NextResponse.json(
      { error: "Failed to save template" },
      { status: 500 }
    );
  }
}