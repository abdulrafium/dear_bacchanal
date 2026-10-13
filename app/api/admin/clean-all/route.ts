import { NextRequest, NextResponse } from "next/server";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { getDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

function extractUploadThingKey(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  if (url.includes("/f/")) {
    const part = url.split("/f/")[1];
    return part ? part.split("?")[0] : null;
  }
  if (url.includes("utfs.io") || url.includes("ufs.sh")) {
    const parts = url.split("/");
    const last = parts[parts.length - 1];
    return last ? last.split("?")[0] : null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    
    // 1. Fetch all live books and orders to extract UploadThing URLs
    const books = await db.collection("user_books").find({}).toArray();
    const orders = await db.collection("orders").find({}).toArray();
    const fileKeys: string[] = [];
    
    for (const book of books) {
      const bookUrls = [
        book.savedSoftPdfUrl,
        book.savedPdfUrl,
        book.pdfUrl,
        book.softUrl,
        book.savedCoverPdfUrl,
        book.coverPdfUrl,
        book.savedTextPdfUrl,
        book.textPdfUrl,
      ];
      for (const u of bookUrls) {
        const k = extractUploadThingKey(u);
        if (k && !fileKeys.includes(k)) fileKeys.push(k);
      }
    }

    for (const order of orders) {
      const orderUrls = [
        order.pdfUrl,
        order.savedPdfUrl,
        order.savedSoftPdfUrl,
        order.softUrl,
        order.coverPdfUrl,
        order.savedCoverPdfUrl,
        order.textPdfUrl,
        order.savedTextPdfUrl,
      ];
      for (const u of orderUrls) {
        const k = extractUploadThingKey(u);
        if (k && !fileKeys.includes(k)) fileKeys.push(k);
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
