import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";
 
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    const purchasedUsers = await db.collection("users").countDocuments({ isPurchased: true });

    // Get financial stats from orders collection
    const ordersCollection = db.collection("orders");
    const totalOrders = await ordersCollection.countDocuments();
    const settings = await db.collection("settings").findOne({ id: "platform_settings" });
    const markup = settings?.pricing?.markupPercentage || 15;
    
    const revenueAggregation = await ordersCollection.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).toArray();
    
    const totalRevenueCents = revenueAggregation[0]?.total || 0;
    const totalRevenue = totalRevenueCents / 100; // Convert to USD
    
    // Profit calculation: Revenue * (Markup / (100 + Markup))
    const totalProfit = totalOrders > 0 ? (totalRevenue * (markup / (100 + markup))) : 0;
    const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
    
    const recentPayments = await ordersCollection
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

    // Prepare chart data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const salesOverTime = await ordersCollection.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]).toArray();

    return NextResponse.json({
      totalRevenue,
      totalProfit,
      totalOrders,
      averageOrderValue,
      markup,
      salesChart: salesOverTime.map(s => ({
        date: s._id,
        revenue: s.revenue / 100,
        count: s.count
      })),
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
