import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/public/export/[id]?type=cover|text
 *
 * Called by SiteFlow (PurePrint) to fetch the customer's book PDF.
 * The [id] is the bookId stored on the order (user_books._id).
 * We look up the user's savedPdfUrl and redirect SiteFlow there.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const type = req.nextUrl.searchParams.get("type") || "text"; // "cover" | "text"

    if (!id) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    const db = await getDatabase();

    // ─── 1. Find the user book ──────────────────────────────────────────────────
    let book: any = null;
    if (ObjectId.isValid(id) && id.length === 24) {
      book = await db.collection("user_books").findOne({ _id: new ObjectId(id) });
    }

    if (!book) {
      console.error(`[export] Book not found for id: ${id}`);
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // ─── 2. Find the associated user to get their savedPdfUrl ─────────────────
    let pdfUrl: string | null = book.savedPdfUrl || null;

    if (!pdfUrl && book.userId) {
      const usersCollection = db.collection("users");
      let user: any = null;

      // Try ObjectId first
      if (ObjectId.isValid(book.userId) && book.userId.length === 24) {
        user = await usersCollection.findOne({ _id: new ObjectId(book.userId) });
      }

      // Fallback: match by email or userId string
      if (!user) {
        user = await usersCollection.findOne({
          $or: [
            { email: book.email },
            { userId: book.userId },
          ].filter(Boolean),
        });
      }

      if (user?.savedPdfUrl) {
        pdfUrl = user.savedPdfUrl;
      }
    }

    // ─── 3. Also check the orders collection for a stored PDF URL ─────────────
    if (!pdfUrl) {
      const order = await db.collection("orders").findOne({ bookId: id });
      if (order?.pdfUrl) {
        pdfUrl = order.pdfUrl;
      }
    }

    if (!pdfUrl) {
      console.error(
        `[export] No PDF URL found for book ${id} (type: ${type}). ` +
        `Book userId: ${book.userId}, email: ${book.email}`
      );
      return NextResponse.json(
        {
          error:
            "No PDF available for this book. The customer has not yet uploaded their completed book PDF.",
          bookId: id,
          type,
        },
        { status: 404 }
      );
    }

    console.log(`[export] Serving PDF for book ${id} (type: ${type}) → ${pdfUrl}`);

    // ─── 4. Redirect SiteFlow to the actual PDF URL ───────────────────────────
    return NextResponse.redirect(pdfUrl, { status: 302 });
  } catch (error: any) {
    console.error("[export] Unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
