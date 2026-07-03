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
    const result = await db.collection("orders").updateMany(
      {},
      { $set: { amount: 0, totalAmount: 0, clearedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: `Revenue cleared. ${result.modifiedCount} order(s) zeroed out.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
