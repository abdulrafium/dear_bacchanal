import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { hash } from "bcryptjs";
import { signUpSchema } from "@/lib/validators";
import { sendEmail } from "@/lib/mail-service";
import { getWelcomeEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email: rawEmail, password, name } = parsed.data;
    const email = rawEmail.toLowerCase();
    const db = await getDatabase();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") }
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create user
    const result = await usersCollection.insertOne({
      email,
      name,
      password: hashedPassword,
      provider: "credentials",
      isPurchased: false,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Send Welcome Email
    try {
      await sendEmail({
        to: email,
        subject: "Welcome to Dear Bacchanal!",
        html: getWelcomeEmail(name)
      });
      console.log(`Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        userId: result.insertedId.toString(),
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
