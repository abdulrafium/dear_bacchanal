import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Retrieve all saved templates for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const db = await getDatabase();
    const templatesCollection = db.collection("book_templates");

    // Find all templates for this user, sorted by creation date (newest first)
    const templates = await templatesCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ templates }, { status: 200 });
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
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to save your book." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const { bookName, images, textData } = body;

    if (!bookName) {
      return NextResponse.json(
        { error: "Book name is required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const templatesCollection = db.collection("book_templates");

    // Update or create the user's single book template (upsert)
    const result = await templatesCollection.updateOne(
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