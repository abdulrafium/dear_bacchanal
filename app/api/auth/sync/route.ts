import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { sendEmail } from "@/lib/mail-service";
import { getWelcomeEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
    try {
        const { email, name, image, uid } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        const db = await getDatabase();
        const usersCollection = db.collection("users");

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
            // Update user details but keep isPurchased and isAdmin status
            const updateResult = await usersCollection.updateOne(
                { email },
                {
                    $set: {
                        name: name || existingUser.name,
                        image: image || existingUser.image,
                        firebaseUid: uid, // Track firebase UID
                        updatedAt: new Date(),
                    }
                }
            );

            return NextResponse.json({
                success: true,
                user: {
                    ...existingUser,
                    name: name || existingUser.name,
                    image: image || existingUser.image,
                }
            });
        } else {
            // Create new user (default isPurchased to false)
            const newUser = {
                email,
                name: name || email.split("@")[0],
                image: image || null,
                firebaseUid: uid,
                provider: "firebase",
                isPurchased: false,
                isAdmin: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await usersCollection.insertOne(newUser);

            // Send Welcome Email
            try {
                await sendEmail({
                    to: email,
                    subject: "Welcome to Dear Bacchanal!",
                    html: getWelcomeEmail(name || email.split("@")[0])
                });
                console.log(`Welcome email sent to new user: ${email}`);
            } catch (emailError) {
                console.error("Failed to send welcome email:", emailError);
            }

            return NextResponse.json({ success: true, user: newUser });
        }
    } catch (error: any) {
        console.error("Sync user error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
