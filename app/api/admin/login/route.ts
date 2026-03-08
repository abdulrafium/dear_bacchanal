import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Hardcoded admin credentials (temporary until full auth)
const ADMIN_EMAIL = "admin@dearbacchanal.com";
const ADMIN_PASSWORD = "Admin@12345";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate a simple token (in production, use JWT)
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Store token in a cookie for server-side verification
    const response = NextResponse.json({
      message: "Login successful",
      token,
      admin: { email: ADMIN_EMAIL, name: "Admin" },
    });

    response.cookies.set("adminToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 24 hours
      path: "/",
    });

    // Store token server-side for validation
    // Using a global variable for simplicity (in production, use Redis/DB)
    (global as any).__adminTokens = (global as any).__adminTokens || {};
    (global as any).__adminTokens[token] = { email: ADMIN_EMAIL, expiry };

    return response;
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
