import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";
 
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getServerAuth();
  const isAdmin = user?.isAdmin || process.env.NODE_ENV === "development";
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const db = await getDatabase();

    // Get user stats
    const totalUsers = await db.collection("users").countDocuments();
    const credentialUsers = await db.collection("users").countDocuments({ provider: "credentials" });
    const googleUsers = await db.collection("users").countDocuments({ provider: "google" });

    // Paid users count: unique emails of customers across payments and active orders
    const paidUserEmailsFromOrders = await db.collection("orders").distinct("email", { 
      status: { $in: ["paid", "processing", "shipped", "delivered", "pending_approval", "approved"] }
    });
    const paidUserEmailsFromPayments = await db.collection("payments").distinct("email");
    const allPaidEmails = Array.from(new Set([...paidUserEmailsFromPayments, ...paidUserEmailsFromOrders])).filter(Boolean);
    const purchasedUsers = allPaidEmails.length;

    // Financial stats: Use payments ledger collection so deleting operational orders does NOT reduce revenue
    const paymentsCollection = db.collection("payments");
    const totalPaymentsCount = await paymentsCollection.countDocuments();
    const ordersCollection = db.collection("orders");
    const totalOrders = await ordersCollection.countDocuments();

    const settings = await db.collection("settings").findOne({ id: "platform_settings" });
    const markup = settings?.pricing?.markupPercentage || 15;
    const taxPercentage = settings?.pricing?.taxPercentage ?? settings?.pricing?.refundDeductionPercentage ?? 20;
    const retainedTaxRatio = taxPercentage / 100;
    
    // Primary source for revenue is the permanent payments ledger.
    // Fall back to ordersCollection only if payments collection is completely empty.
    const usePayments = totalPaymentsCount > 0;
    const primaryRevenueColl = usePayments ? paymentsCollection : ordersCollection;

    const revenueAggregation = await primaryRevenueColl.aggregate([
      {
        $project: {
          netAmount: {
            $cond: {
              if: { $eq: ["$status", "refunded"] },
              then: { $multiply: ["$amount", retainedTaxRatio] }, // Retain tax/fee deduction for refunded orders
              else: "$amount" // 100% full checkout amount for active paid orders
            }
          }
        }
      },
      { $group: { _id: null, total: { $sum: "$netAmount" } } }
    ]).toArray();
    
    const totalRevenueCents = revenueAggregation[0]?.total || 0;
    const totalRevenue = totalRevenueCents / 100; // Convert to USD
    
    // Total transactions count
    const totalTransactions = usePayments ? totalPaymentsCount : totalOrders;

    // Profit calculation: Revenue * (Markup / (100 + Markup))
    const totalProfit = totalTransactions > 0 ? (totalRevenue * (markup / (100 + markup))) : 0;
    
    const recentPayments = await (usePayments ? paymentsCollection : ordersCollection)
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Re-fetch book stats
    const booksCreated = await db.collection("user_books").countDocuments();
    const booksWithImages = await db.collection("user_books").countDocuments({ 
        $or: [
            { images: { $ne: null } },
            { "spreads.leftPage.elements.type": "image" },
            { "spreads.rightPage.elements.type": "image" }
        ]
    });

    const recentUsers = await db.collection("users")
      .find({}, { projection: { password: 0, oneTimeToken: 0, oneTimeTokenExpiry: 0 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Prepare continuous 7-day chart data (today and past 6 days)
    const chartMap: Record<string, { revenue: number; count: number }> = {};
    const todayDate = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(todayDate.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      chartMap[dateStr] = { revenue: 0, count: 0 };
    }

    // Populate chart buckets from permanent payments ledger (fallback to orders)
    const sourceRecords = await (usePayments ? paymentsCollection : ordersCollection).find({}).toArray();
    sourceRecords.forEach((item: any) => {
      if (item.createdAt) {
        const dateObj = new Date(item.createdAt);
        if (!isNaN(dateObj.getTime())) {
          const dateStr = dateObj.toISOString().split("T")[0];
          if (chartMap[dateStr] !== undefined) {
            chartMap[dateStr].revenue += (item.amount || 0);
            chartMap[dateStr].count += 1;
          }
        }
      }
    });

    const salesChart = Object.keys(chartMap).map((date) => ({
      date,
      revenue: chartMap[date].revenue / 100,
      count: chartMap[date].count,
    }));

    return NextResponse.json({
      totalRevenue,
      totalProfit,
      totalOrders: totalTransactions,
      markup,
      salesChart,
      recentPayments: recentPayments.map(p => ({
        id: p._id.toString(),
        email: p.email,
        amount: p.amount / 100,
        createdAt: p.createdAt
      })),
      stats: {
        totalUsers,
        credentialUsers,
        googleUsers,
        purchasedUsers,
        booksCreated,
        booksWithImages,
        paidOrders: totalOrders,
      },
      recentUsers: recentUsers.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        provider: u.provider,
        isPurchased: u.isPurchased || false,
        createdAt: u.createdAt,
      })),
    });

  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
