import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

// POST - Generate a share link (create a shareId if not exists)
export async function POST(req: NextRequest) {
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

        // Check if user has a template
        const template = await templatesCollection.findOne({ userId });

        if (!template) {
            return NextResponse.json(
                { error: "No book found to share. Please save your book first." },
                { status: 404 }
            );
        }

        // Reuse existing shareId or create a new one
        let shareId = template.shareId;
        if (!shareId) {
            shareId = uuidv4();
            await templatesCollection.updateOne(
                { _id: template._id },
                {
                    $set: {
                        shareId,
                        isPublic: true // Default to public when link is generated
                    }
                }
            );
        }

        const baseUrl = req.headers.get("origin") || "";
        const shareUrl = `${baseUrl}/book/${shareId}`;

        return NextResponse.json(
            {
                shareUrl,
                shareId,
                isPublic: template.isPublic !== false // Default to true if undefined
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error generating share link:", error);
        return NextResponse.json(
            { error: "Failed to generate share link" },
            { status: 500 }
        );
    }
}

// PATCH - Toggle privacy settings
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const body = await req.json();
        const { isPublic } = body;

        const db = await getDatabase();
        const templatesCollection = db.collection("book_templates");

        const result = await templatesCollection.updateOne(
            { userId },
            { $set: { isPublic } }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { error: "Book not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Privacy settings updated", isPublic },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating privacy:", error);
        return NextResponse.json(
            { error: "Failed to update privacy settings" },
            { status: 500 }
        );
    }
}
