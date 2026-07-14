import { NextRequest, NextResponse } from "next/server";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    
    // 1. Fetch all live books to extract UploadThing URLs
    const books = await db.collection("user_books").find({}).toArray();
    const fileKeys: string[] = [];
    
    for (const book of books) {
      if (book.savedCoverPdfUrl) {
        const key = book.savedCoverPdfUrl.split('/f/')[1];
        if (key) fileKeys.push(key);
      }
      if (book.savedTextPdfUrl) {
        const key = book.savedTextPdfUrl.split('/f/')[1];
        if (key) fileKeys.push(key);
      }
      if (book.savedPdfUrl) {
        const key = book.savedPdfUrl.split('/f/')[1];
        if (key) fileKeys.push(key);
      }
    }

    // 2. Permanently destroy physical PDF files from UploadThing cloud
    if (fileKeys.length > 0) {
      const { UTApi } = await import("uploadthing/server");
      const utapi = new UTApi();
      await utapi.deleteFiles(fileKeys).catch(err => console.error("UploadThing wipe failed:", err));
    }

    // 3. Wipe all user_books from the database (Live Books)
    await db.collection("user_books").deleteMany({});

    // 4. Wipe all orders from the database to ensure no broken references
    await db.collection("orders").deleteMany({});

    return NextResponse.json({ 
      success: true, 
      message: `Successfully wiped ${books.length} live books, deleted ${fileKeys.length} cloud PDFs, and cleared all orders.` 
    });
  } catch (error: any) {
    console.error("Clean All Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
