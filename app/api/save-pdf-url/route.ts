import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { fileUrl } = await req.json();

        if (!fileUrl) {
            return NextResponse.json({ error: "File URL is required" }, { status: 400 });
        }

        // Save PDF URL to database
        const db = await getDatabase();
        const usersCollection = db.collection("users");

        console.log("Attempting to save PDF URL for user:", user.id);
        console.log("File URL:", fileUrl);

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(user.id) },
            {
                $set: {
                    savedPdfUrl: fileUrl,
                    pdfUploadedAt: new Date()
                }
            }
        );

        console.log("Update result:", result);

        if (result.matchedCount === 0) {
            console.error("No user found with ID:", user.id);
            return NextResponse.json({ error: "User not found in database" }, { status: 404 });
        }

        if (result.modifiedCount === 0) {
            console.warn("User found but document not modified (maybe same URL?)");
        }

        console.log("PDF URL saved successfully for user:", user.id);
        return NextResponse.json({ success: true, modified: result.modifiedCount > 0 });

    } catch (error: any) {
        console.error("Save PDF URL Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
