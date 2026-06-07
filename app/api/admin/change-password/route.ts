import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { hash } from "bcryptjs";
import { sendEmail } from "@/lib/mail-service";
import { getBaseEmailTemplate } from "@/lib/email-templates";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPassword } = await req.json();
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 10);
    const db = await getDatabase();
    const usersCollection = db.collection("users");

    await usersCollection.updateOne(
      { email: session.user.email },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    // Send Confirmation Email
    try {
        await sendEmail({
            to: session.user.email!,
            subject: "Your Dear Bacchanal Security Update",
            html: getBaseEmailTemplate(`
                <h1 class="title">Password Changed</h1>
                <p>Hello,</p>
                <p>This is a confirmation that the password for your Dear Bacchanal account has recently been changed.</p>
                <p>If you did not make this change, please contact support immediately.</p>
            `, "Security Update: Password Changed")
        });
    } catch (e) {
        console.error("Failed to send password change email:", e);
    }

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
