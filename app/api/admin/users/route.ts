export const revalidate = 300; // Cache for 5 minutes to scale for high traffic

import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { ObjectId } from "mongodb";
import { hash } from "bcryptjs";
import { sendEmail } from "@/lib/mail-service";

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
        const user = await usersCollection.findOne({ _id: objectId });
        if (!user) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }
        
        const newPassword = value || "Temp@1234";
        
        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword)) {
          return NextResponse.json({ error: "Password must be at least 8 characters and contain at least one uppercase letter." }, { status: 400 });
        }

        const hashedPassword = await hash(newPassword, 12);
        
        await usersCollection.updateOne(
          { _id: objectId },
          { $set: { password: hashedPassword, updatedAt: new Date() } }
        );

        const emailContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111; line-height: 1.6;">
            <h1 style="color: #ff4757; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Dear Bacchanal Carnival</h1>
            <p>Dear <strong>${user.name || "User"}</strong>,</p>
            <p>Your password has been reset by an admin.</p>
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 12px; border-left: 4px solid #ff4757; margin: 25px 0;">
              Our New Password below:
              <div style="font-size: 24px; font-weight: bold; margin-top: 10px; color: #ff4757; letter-spacing: 2px;">
                ${newPassword}
              </div>
            </div>
            <p style="background-color: #fff3f3; padding: 10px; border-radius: 8px; font-size: 14px; color: #cc0000;">
              <strong>Note:</strong> Please change your password from your dashboard after logging in.
            </p>
          </div>
        `;

        await sendEmail({
          from: '"Dear Bacchanal" <admin@dearbacchanal.com>',
          to: user.email, 
          subject: "Password Reset - Dear Bacchanal Carnival",
          html: emailContent
        });

        return NextResponse.json({ message: "Password reset successfully and email sent." });
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

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(req: NextRequest) {
  const authError = await adminAuthMiddleware();
  if (authError) return authError;

  try {
    const db = await getDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (userId) {
      await db.collection("users").deleteOne({ _id: new ObjectId(userId) });
      return NextResponse.json({ success: true, message: "User deleted" });
    }
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
