import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";
import { auth } from "@/lib/auth";
 
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const user = await getServerAuth(req);
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

    // Get order/payment stats
    const paidOrders = await db.collection("users").countDocuments({ isPurchased: true });
    
    // Get recent users
    const recentUsers = await db.collection("users")
      .find({}, { projection: { password: 0, oneTimeToken: 0, oneTimeTokenExpiry: 0 } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    // Get book data count
    const booksCreated = await db.collection("user_books").countDocuments();
    
    // Proper way to check if object is not empty in MongoDB projection or by fetching then filtering
    const booksWithImages = await db.collection("user_books").countDocuments({ 
        $or: [
            { images: { $ne: null } },
            { "spreads.leftPage.elements.type": "image" },
            { "spreads.rightPage.elements.type": "image" }
        ]
    });

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
