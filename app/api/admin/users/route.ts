import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { ObjectId } from "mongodb";
import { hash } from "bcryptjs";

// GET - List all users
export async function GET(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const total = await db.collection("users").countDocuments(filter);
    const users = await db.collection("users")
      .find(filter, { projection: { password: 0, oneTimeToken: 0, oneTimeTokenExpiry: 0 } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      users: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        provider: u.provider,
        isPurchased: u.isPurchased || false,
        isDisabled: u.isDisabled || false,
        country: u.country,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update user (reset password, disable, etc.)
export async function PATCH(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    const { userId, action, value } = await req.json();

    if (!userId || !action) {
      return NextResponse.json({ error: "userId and action required" }, { status: 400 });
    }

    const usersCollection = db.collection("users");
    const objectId = new ObjectId(userId);

    switch (action) {
      case "resetPassword": {
        const newPassword = value || "Temp@1234";
        const hashedPassword = await hash(newPassword, 12);
        await usersCollection.updateOne(
          { _id: objectId },
          { $set: { password: hashedPassword, updatedAt: new Date() } }
        );
        return NextResponse.json({ message: `Password reset to: ${newPassword}` });
      }

      case "toggleDisable": {
        const user = await usersCollection.findOne({ _id: objectId });
        const newState = !(user?.isDisabled);
        await usersCollection.updateOne(
          { _id: objectId },
          { $set: { isDisabled: newState, updatedAt: new Date() } }
        );
        return NextResponse.json({ message: newState ? "User disabled" : "User enabled", isDisabled: newState });
      }

      case "togglePurchased": {
        const user = await usersCollection.findOne({ _id: objectId });
        const newState = !(user?.isPurchased);
        await usersCollection.updateOne(
          { _id: objectId },
          { $set: { isPurchased: newState, updatedAt: new Date() } }
        );
        return NextResponse.json({ message: newState ? "Purchase enabled" : "Purchase revoked", isPurchased: newState });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
