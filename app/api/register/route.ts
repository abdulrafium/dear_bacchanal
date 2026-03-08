import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getDatabase } from "@/lib/db";
import { signUpSchema } from "@/lib/validators";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate input
    const validatedData = signUpSchema.parse(body);

    // Get database
    const db = await getDatabase();
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: validatedData.email,
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(validatedData.password, 12);

    // Create user
    const result = await usersCollection.insertOne({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      provider: "credentials",
      image: null,
      emailVerified: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Return success response
    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: result.insertedId.toString(),
          name: validatedData.name,
          email: validatedData.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}