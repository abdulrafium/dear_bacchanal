import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getServerAuth } from "@/lib/server-auth";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    try {
        const user = await getServerAuth(req);

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await getDatabase();
        const usersCollection = db.collection("users");

        // Use the same dual-ID logic as in check-payment
        let query: any;
        const id = user.id;

        if (id && id.length === 24) {
            try {
                query = { _id: new ObjectId(id) };
            } catch {
                query = { firebaseUid: id };
            }
        } else {
            query = { firebaseUid: id };
        }

        await usersCollection.updateOne(
            query,
            {
                $set: {
                    isPurchased: false,
                    updatedAt: new Date(),
                }
            }
        );

        return NextResponse.json({ success: true, message: "Purchase consumed" });
    } catch (error: any) {
        console.error("Consume purchase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
