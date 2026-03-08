import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Retrieve all book text data for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ data: {} }, { status: 200 });
    }

    const db = await getDatabase();
    const dataCollection = db.collection("book_data");

    // Find all text data for this user
    const data = await dataCollection.findOne({ userId });

    if (!data) {
      return NextResponse.json({ data: {} }, { status: 200 });
    }

    return NextResponse.json({ data: data.textData || {} }, { status: 200 });
  } catch (error) {
    console.error("Error fetching book data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

// POST - Save or update book text data
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fieldId, value } = body;

    if (!fieldId) {
      return NextResponse.json(
        { error: "Missing fieldId" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const dataCollection = db.collection("book_data");

    // Update or insert the text data for this user
    await dataCollection.updateOne(
      { userId },
      {
        $set: {
          [`textData.${fieldId}`]: value || "",
          updatedAt: new Date(),
        },
        $setOnInsert: {
          userId,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json(
      { message: "Data saved successfully", fieldId, value },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving book data:", error);
    return NextResponse.json(
      { error: "Failed to save data" },
      { status: 500 }
    );
  }
}