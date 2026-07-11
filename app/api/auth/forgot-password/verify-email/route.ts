import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection("users");
    
    // Check if user exists
    const user = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") }
    });

    if (!user) {
      return NextResponse.json({ error: "Account not found with this email" }, { status: 404 });
    }

    if (user.provider === "google") {
      return NextResponse.json({ error: "This account uses Google Sign-In. Please sign in with Google." }, { status: 400 });
    }

    return NextResponse.json({ success: true, name: user.name });

  } catch (error: any) {
    console.error("Verify Email Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
