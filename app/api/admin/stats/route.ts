import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const authError = adminAuthMiddleware(req);
  if (authError) return authError;

  try {
    const db = await getDatabase();

    // Get user stats
    const totalUsers = await db.collection("users").countDocuments();
    const credentialUsers = await db.collection("users").countDocuments({ provider: "credentials" });
    const googleUsers = await db.collection("users").countDocuments({ provider: "google" });
    const purchasedUsers = await db.collection("users").countDocuments({ isPurchased: true });

    // Get order/payment stats
    const paidOrders = await db.collection("users").countDocuments({ isPurchased: true });
    
    // Get recent users
    const recentUsers = await db.collection("users")
      .find({}, { projection: { password: 0, oneTimeToken: 0, oneTimeTokenExpiry: 0 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Get book data count
    const booksCreated = await db.collection("book_data").countDocuments();
    const booksWithImages = await db.collection("book_images").countDocuments();

    return NextResponse.json({
      stats: {
        totalUsers,
        credentialUsers,
        googleUsers,
        purchasedUsers,
        paidOrders,
        booksCreated,
        booksWithImages,
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
