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
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bookId = formData.get("bookId") as string | null;
    const templateName = formData.get("templateName") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[upload-pdf] Uploading PDF for user ${userId}, book ${bookId}, template "${templateName}"`);

    // ─── 1. Upload to UploadThing ─────────────────────────────────────────────
    const utapi = new UTApi();
    const uploadResult = await utapi.uploadFiles(file);

    if (uploadResult.error) {
      console.error("[upload-pdf] UploadThing error:", uploadResult.error);
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.error.message}` },
        { status: 500 }
      );
    }

    const fileUrl = uploadResult.data?.ufsUrl || uploadResult.data?.url;
    if (!fileUrl) {
      return NextResponse.json({ error: "No URL returned from upload" }, { status: 500 });
    }

    console.log(`[upload-pdf] PDF uploaded successfully: ${fileUrl}`);

    const db = await getDatabase();

    // ─── 2. Save URL to user record ───────────────────────────────────────────
    try {
      const userQuery = ObjectId.isValid(userId) && userId.length === 24
        ? { _id: new ObjectId(userId) }
        : { email: user.email };

      await db.collection("users").updateOne(
        userQuery,
        { $set: { savedPdfUrl: fileUrl, pdfUploadedAt: new Date() } }
      );
      console.log("[upload-pdf] Saved PDF URL to user record");
    } catch (userErr) {
      console.error("[upload-pdf] Failed to save to user record:", userErr);
    }

    // ─── 3. Save URL to user_book record ──────────────────────────────────────
    try {
      let bookQuery: any = null;

      if (bookId && ObjectId.isValid(bookId) && bookId.length === 24) {
        bookQuery = { _id: new ObjectId(bookId) };
      } else if (templateName) {
        bookQuery = {
          $or: [{ userId }, { email: user.email }],
          activeTemplateName: templateName,
        };
      }

      if (bookQuery) {
        await db.collection("user_books").updateOne(
          bookQuery,
          { $set: { savedPdfUrl: fileUrl, pdfUploadedAt: new Date() } }
        );
        console.log("[upload-pdf] Saved PDF URL to user_books record");
      }
    } catch (bookErr) {
      console.error("[upload-pdf] Failed to save to user_books record:", bookErr);
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      message: "PDF uploaded and saved. SiteFlow will now be able to fetch it.",
    });
  } catch (error: any) {
    console.error("[upload-pdf] Unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
