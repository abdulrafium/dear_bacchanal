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
    } else if (id.length === 18) {
      // Support matching by the 18-character truncated Book ID
      const match = await db.collection("user_books").aggregate([
        { $addFields: { idString: { $toString: "$_id" } } },
        { $match: { idString: { $regex: `${id}$` } } }
      ]).toArray();
      
      if (match.length > 0) {
        book = match[0];
      }
    }

    // Fallback: If they accidentally provided the Order ID (24 or 18 char) instead of the Book ID
    if (!book) {
      let orderQuery: any = { sourceOrderId: id };
      let order: any = null;

      if (ObjectId.isValid(id) && id.length === 24) {
        orderQuery = { $or: [{ sourceOrderId: id }, { _id: new ObjectId(id) }] };
        order = await db.collection("orders").findOne(orderQuery);
      } else if (id.length === 18) {
        // Find order where _id ends with the 18-character string, or sourceOrderId matches
        const orderMatch = await db.collection("orders").aggregate([
          { $addFields: { idString: { $toString: "$_id" } } },
          { $match: { $or: [{ idString: { $regex: `${id}$` } }, { sourceOrderId: id }] } }
        ]).toArray();
        if (orderMatch.length > 0) {
          order = orderMatch[0];
        }
      } else {
        order = await db.collection("orders").findOne(orderQuery);
      }
      
      if (order && order.bookId) {
        book = await db.collection("user_books").findOne({ _id: new ObjectId(order.bookId) });
      }
    }

    if (!book) {
      console.error(`[export] Book not found for id: ${id}`);
      return NextResponse.json(
        { error: "Book not found" },
        { status: 404 }
      );
    }

    // ─── 2. Find the associated user to get their savedPdfUrl ─────────────────
    let pdfUrl: string | null = null;
    
    // Select the exact URL based on type
    if (type === "cover" && book.savedCoverPdfUrl) {
      pdfUrl = book.savedCoverPdfUrl;
    } else if (type === "text" && book.savedTextPdfUrl) {
      pdfUrl = book.savedTextPdfUrl;
    } else if (book.savedPdfUrl) {
      pdfUrl = book.savedPdfUrl; // Fallback
    }

    if (!pdfUrl && book.userId) {
      console.warn(`[export] Book ${id} has no PDF URL directly attached. Waiting for customer to complete PDF upload.`);
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
