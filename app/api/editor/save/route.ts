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
    const { isAdmin, spreads, activeTemplateName, currentSpreadIndex } = body;

    const db = await getDatabase();

    if (isAdmin) {
      // Save to global templates
      const templatesCollection = db.collection("global_templates");
      await templatesCollection.updateOne(
        { templateName: activeTemplateName || "New Template" },
        {
          $set: {
            templateName: activeTemplateName || "New Template",
            spreads: spreads || [],
            currentSpreadIndex: currentSpreadIndex || 0,
            updatedAt: new Date(),
            updatedBy: userId,
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      return NextResponse.json({ message: "Template saved successfully!" }, { status: 200 });
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
