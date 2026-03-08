import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Retrieve all book images for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ images: {} }, { status: 200 });
    }

    const db = await getDatabase();
    const imagesCollection = db.collection("book_images");

    // Find all images for this user
    const images = await imagesCollection.findOne({ userId });

    if (!images) {
      return NextResponse.json({ images: {} }, { status: 200 });
    }

    return NextResponse.json({ images: images.imageMap || {} }, { status: 200 });
  } catch (error) {
    console.error("Error fetching book images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 }
    );
  }
}

// POST - Save or update a book image URL
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
    const { imageId, imageUrl } = body;

    if (!imageId || !imageUrl) {
      return NextResponse.json(
        { error: "Missing imageId or imageUrl" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const imagesCollection = db.collection("book_images");

    // Update or insert the image URL for this user
    await imagesCollection.updateOne(
      { userId },
      {
        $set: {
          [`imageMap.${imageId}`]: imageUrl,
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
      { message: "Image saved successfully", imageId, imageUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving book image:", error);
    return NextResponse.json(
      { error: "Failed to save image" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a book image
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const imageId = searchParams.get("imageId");

    if (!imageId) {
      return NextResponse.json(
        { error: "Missing imageId" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const imagesCollection = db.collection("book_images");

    // Remove the image from the map
    await imagesCollection.updateOne(
      { userId },
      {
        $unset: {
          [`imageMap.${imageId}`]: "",
        },
        $set: {
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json(
      { message: "Image deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting book image:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}