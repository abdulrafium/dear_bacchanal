import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword)) {
      return NextResponse.json({ error: "New password does not meet security requirements" }, { status: 400 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection("users");
    
    const user = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") }
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found with this email" }, { status: 404 });
    }

    // Verify OTP exists and matches
    if (!user.otp || user.otp !== otp) {
      return NextResponse.json({ error: "Invalid 6-digit code" }, { status: 400 });
    }

    // Verify OTP is not expired
    if (!user.otpExpiry || new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 12);

    // Update DB and remove OTP entirely
    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { password: hashedPassword, updatedAt: new Date() },
        $unset: { otp: "", otpExpiry: "" }
      }
    );

    return NextResponse.json({ success: true, message: "Password updated successfully" });

  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
