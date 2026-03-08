import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

// GET - Retrieve shared book data
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ shareId: string }> }
) {
    try {
        // Await params as required in Next.js 15+ (or recent 14+ behavior changes)
        const { shareId } = await params;

        if (!shareId) {
            return NextResponse.json(
                { error: "Share ID is required" },
                { status: 400 }
            );
        }

        const db = await getDatabase();
        const templatesCollection = db.collection("book_templates");

        const template = await templatesCollection.findOne({ shareId });

        if (!template) {
            return NextResponse.json(
                { error: "Book not found" },
                { status: 404 }
            );
        }

        if (template.isPublic === false) {
            return NextResponse.json(
                { error: "This book is private" },
                { status: 403 }
            );
        }

        // Return only necessary public data
        return NextResponse.json(
            {
                bookName: template.bookName,
                images: template.images || {},
                textData: template.textData || {},
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching shared book:", error);
        return NextResponse.json(
            { error: "Failed to fetch book" },
            { status: 500 }
        );
    }
}
