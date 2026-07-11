import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { compare, hash } from "bcryptjs";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword)) {
      return NextResponse.json({ error: "New password does not meet security requirements" }, { status: 400 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection("users");
    const objectId = new ObjectId(session.user.id);

    const dbUser = await usersCollection.findOne({ _id: objectId });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!dbUser.password) {
      return NextResponse.json({ error: "This account does not use a password. Please sign in with Google." }, { status: 400 });
    }

    // Verify current password
    const isMatch = await compare(currentPassword, dbUser.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password does not match" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update database
    await usersCollection.updateOne(
      { _id: objectId },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    return NextResponse.json({ message: "Password updated successfully" });

  } catch (error: any) {
    console.error("Change Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
