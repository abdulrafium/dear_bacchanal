import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`Webhook signature verification failed: ${error.message}`);
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const shippingDetails = session.shipping_details;
        const email = session.customer_email || session.customer_details?.email;

        try {
            const db = await getDatabase();
            const usersCollection = db.collection("users");

            if (userId) {
                await usersCollection.updateOne(
                    { _id: new ObjectId(userId) },
                    {
                        $set: {
                            isPurchased: true,
                            shippingDetails: shippingDetails ?? undefined,
                            updatedAt: new Date(),
                        },
                    }
                );
                console.log(`User ${userId} purchase updated via webhook`);
            } else if (email) {
                const existing = await usersCollection.findOne({ email });
                if (existing) {
                    await usersCollection.updateOne(
                        { _id: existing._id },
                        {
                            $set: {
                                isPurchased: true,
                                shippingDetails: shippingDetails ?? undefined,
                                updatedAt: new Date(),
                            },
                        }
                    );
                } else {
                    await usersCollection.insertOne({
                        email,
                        name: session.customer_details?.name ?? email.split("@")[0],
                        provider: "stripe",
                        password: null,
                        image: null,
                        emailVerified: new Date(),
                        isPurchased: true,
                        shippingDetails: shippingDetails ?? undefined,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                console.log(`Guest user ${email} created/updated via webhook`);
            }
        } catch (error) {
            console.error("Error updating user purchase status:", error);
            return NextResponse.json(
                { error: "Internal server error" },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ received: true });
}
