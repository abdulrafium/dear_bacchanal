import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { UTApi } from "uploadthing/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/editor/upload-pdf
 *
 * Called automatically after the user's PDF is generated in the editor.
 * Uploads the PDF to UploadThing and saves the URL to both the user record
 * and the user_book record so SiteFlow can fetch it for hard-copy printing.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getServerAuth();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id || user.email || "";
    const contentType = req.headers.get("content-type") || "";
    
    let coverUrl: string | undefined;
    let textUrl: string | undefined;
    let bookId: string | null = null;
    let templateName: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      coverUrl = body.coverUrl;
      textUrl = body.textUrl;
      bookId = body.bookId;
      templateName = body.templateName;
    } else {
      return NextResponse.json({ error: "Invalid Content-Type, expected application/json" }, { status: 400 });
    }

    if (!coverUrl || !textUrl) {
      return NextResponse.json({ error: "Failed to retrieve URLs" }, { status: 500 });
    }

    console.log(`[upload-pdf] PDFs uploaded successfully: Cover(${coverUrl}) Text(${textUrl})`);

    const db = await getDatabase();

    const updateFields = {
      savedCoverPdfUrl: coverUrl,
      savedTextPdfUrl: textUrl,
      pdfUploadedAt: new Date()
    };

    // We intentionally DO NOT save PDF URLs to the `users` collection anymore,
    // because that caused the system to mistakenly serve old PDFs for new orders.

    // ─── 3. Save URLs to user_book record ──────────────────────────────────────
    try {
      let bookQuery: any = null;

      // Ensure bookId is a string (Next.js sometimes serializes ObjectId as {"$oid": "..."})
      let cleanBookId = bookId;
      if (typeof bookId === 'object' && bookId !== null && (bookId as any).$oid) {
        cleanBookId = (bookId as any).$oid;
      }

      if (cleanBookId && typeof cleanBookId === 'string') {
        if (ObjectId.isValid(cleanBookId) && cleanBookId.length === 24) {
          bookQuery = { _id: new ObjectId(cleanBookId) };
        } else if (cleanBookId.length === 18) {
          // If the frontend accidentally passed the truncated 18-character SiteFlow ID,
          // find the book whose _id ends with this string.
          const match = await db.collection("user_books").aggregate([
            { $addFields: { idString: { $toString: "$_id" } } },
            { $match: { idString: { $regex: `${cleanBookId}$` } } }
          ]).toArray();
          
          if (match.length > 0) {
            bookQuery = { _id: match[0]._id };
          }
        }
      } 
      
      if (!bookQuery && templateName) {
        bookQuery = {
          $or: [{ userId }, { email: user.email }],
          activeTemplateName: templateName,
        };
      }

      console.log(`[upload-pdf] Using bookQuery:`, JSON.stringify(bookQuery));

      let matchedCount = 0;
      let modifiedCount = 0;
      let errorMessage = null;

      if (bookQuery) {
        const result = await db.collection("user_books").updateOne(bookQuery, { $set: updateFields });
        console.log(`[upload-pdf] Database update result: matched ${result.matchedCount}, modified ${result.modifiedCount}`);
        matchedCount = result.matchedCount;
        modifiedCount = result.modifiedCount;
        
        if (result.matchedCount === 0) {
            console.error(`[upload-pdf] CRITICAL ERROR: Could not find user_book in database for this query!`);
            errorMessage = "Could not find matching book in database to save PDF URLs.";
        }
      } else {
        errorMessage = "No bookQuery generated (missing bookId and templateName)";
      }

      // WRITE TO DEBUG_LOGS COLLECTION SO I CAN SEE IT
      await db.collection("debug_logs").insertOne({
        action: "upload-pdf",
        timestamp: new Date(),
        bookId_received: bookId,
        cleanBookId: cleanBookId,
        templateName: templateName,
        bookQuery: JSON.stringify(bookQuery),
        matchedCount,
        modifiedCount,
        errorMessage,
        coverUrl,
        textUrl
      }).catch(() => {}); // ignore errors

      if (errorMessage) {
        return NextResponse.json({ error: errorMessage }, { status: 404 });
      }

    } catch (bookErr) {
      console.error("[upload-pdf] Failed to save to user_books record:", bookErr);
    }

    return NextResponse.json({
      success: true,
      coverUrl,
      textUrl,
      message: "PDFs uploaded and saved. SiteFlow will now be able to fetch them.",
    });
  } catch (error: any) {
    console.error("[upload-pdf] Unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
