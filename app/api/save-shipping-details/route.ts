import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { shippingDetails } = await req.json();

        if (!shippingDetails) {
            return NextResponse.json({ error: "Shipping details required" }, { status: 400 });
        }

        // Save shipping details to database
        const db = await getDatabase();
        const usersCollection = db.collection("users");

        console.log("Saving shipping details for user:", user.id);
        console.log("Shipping details:", shippingDetails);

        const result = await usersCollection.updateOne(
            { _id: new ObjectId(user.id) },
            {
                $set: {
                    shippingDetails: shippingDetails,
                    updatedAt: new Date()
                }
            }
        );

        console.log("Shipping details save result:", result);

        if (result.matchedCount === 0) {
            console.error("No user found with ID:", user.id);
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Save shipping details error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
