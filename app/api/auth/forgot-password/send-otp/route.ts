import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { sendEmail } from "@/lib/mail-service";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection("users");
    
    const user = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") }
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found with this email" }, { status: 404 });
    }

    // Generate 6-digit random code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    // Save to DB
    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { otp, otpExpiry, updatedAt: new Date() } }
    );

    // Send email
    const emailContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111; line-height: 1.6;">
        <h1 style="color: #ff4757; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">Dear Bacchanal Carnival</h1>
        <p>Dear <strong>${user.name || "User"}</strong>,</p>
        <p>Your OTP for resetting your password is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; border-radius: 12px; border-left: 4px solid #ff4757; margin: 25px 0; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #ff4757; letter-spacing: 8px;">
            ${otp}
          </div>
        </div>
        <p style="background-color: #fff3f3; padding: 10px; border-radius: 8px; font-size: 14px; color: #cc0000;">
          <strong>Note:</strong> This code is valid for exactly 3 minutes.
        </p>
      </div>
    `;

    await sendEmail({
      from: '"Dear Bacchanal" <admin@dearbacchanal.com>',
      to: user.email, 
      subject: "Your OTP - Dear Bacchanal Carnival",
      html: emailContent
    });

    return NextResponse.json({ success: true, message: "OTP sent successfully" });

  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
