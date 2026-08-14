import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { ObjectId } from "mongodb";

// GET — list payments, paginated + searchable
export async function GET(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get("page")  || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const filter: any = {};
    if (search) {
      filter.$or = [
        { email:          { $regex: search, $options: "i" } },
        { customerName:   { $regex: search, $options: "i" } },
        { transactionRef: { $regex: search, $options: "i" } },
        { orderId:        { $regex: search, $options: "i" } },
      ];
    }

    const total = await db.collection("payments").countDocuments(filter);
    const payments = await db.collection("payments")
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      payments: payments.map(p => ({
        id:              p._id.toString(),
        orderId:         p.orderId,
        orderDbId:       p.orderDbId || null,
        paymentIntentId: p.paymentIntentId || null,
        transactionRef:  p.transactionRef,
        userId:          p.userId || null,
        email:           p.email,
        customerName:    p.customerName,
        amount:          p.amount,
        currency:        p.currency || "usd",
        type:            p.type,
        templateName:    p.templateName,
        status:          p.status,
        previousBalance: p.previousBalance,
        afterBalance:    p.afterBalance,
        createdAt:       p.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — single by ?id=xxx  OR  all by ?all=true
export async function DELETE(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    const id  = searchParams.get("id");
    const all = searchParams.get("all");

    if (all === "true") {
      const result = await db.collection("payments").deleteMany({});
      return NextResponse.json({ success: true, deleted: result.deletedCount });
    }

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await db.collection("payments").deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
