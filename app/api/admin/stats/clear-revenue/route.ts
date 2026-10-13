import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// POST /api/admin/stats/clear-revenue
// Sets all order amounts to 0 so Revenue/Profit/AvgTicket stats show $0
export async function POST(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    // 1. Wipe permanent payments ledger so dashboard revenue and payments page reset to $0
    const paymentsResult = await db.collection("payments").deleteMany({});

    // 2. Zero out orders collection amounts
    const ordersResult = await db.collection("orders").updateMany(
      {},
      { $set: { amount: 0, totalAmount: 0, clearedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: `Revenue cleared. ${paymentsResult.deletedCount} payment record(s) wiped and ${ordersResult.modifiedCount} order(s) zeroed out.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
