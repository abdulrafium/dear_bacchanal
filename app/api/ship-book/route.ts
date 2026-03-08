
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { HPSiteFlowClient } from "@/lib/hp-site-flow";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const user = session?.user;

        if (!user || !user.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        let { fileUrl } = body;

        // 1. Get User Shipping Details from DB
        const db = await getDatabase();
        const usersCollection = db.collection("users");
        // Assuming user.id is the _id in MongoDB, verify if it's string or ObjectId
        // In checkout/route.ts it used user.id.
        // In webhook it used metadata.userId which was passed from user.id.
        // Let's assume user.id is valid.

        const dbUser = await usersCollection.findOne({ _id: new ObjectId(user.id) });

        if (!dbUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (!dbUser.isPurchased) {
            return NextResponse.json({ error: "Book not purchased" }, { status: 403 });
        }

        const shippingDetails = dbUser.shippingDetails;

        if (!shippingDetails) {
            return NextResponse.json({ error: "Shipping details not found" }, { status: 400 });
        }

        // If no fileUrl provided, try to use saved PDF URL from database
        if (!fileUrl) {
            fileUrl = dbUser.savedPdfUrl;
            if (!fileUrl) {
                return NextResponse.json({
                    error: "PDF not uploaded. Please generate and upload the PDF first."
                }, { status: 400 });
            }
        }

        // 2. Prepare Order Data for HP Site Flow
        // We need a unique order ID. We can use the user ID + timestamp or a new UUID.
        // Let's use a simple timestamp-based ID for now, or maybe nanoid if available.
        const sourceOrderId = `${user.id}-${Date.now()}`;
        const isDev = process.env.NODE_ENV === "development";
        let sku = process.env.HP_BOOK_SKU;
        if (!sku) {
            if (isDev) {
                sku = "DEV-PLACEHOLDER-SKU";
                console.warn("[ship-book] HP_BOOK_SKU not set. Using placeholder for local testing. Add HP_BOOK_SKU to .env for real orders.");
            } else {
                return NextResponse.json(
                    { error: "HP_BOOK_SKU not configured. Add HP_BOOK_SKU to .env with the book SKU from your printing publisher." },
                    { status: 400 }
                );
            }
        }
        console.log("[ship-book] Using HP_BOOK_SKU:", sku);

        const hpClient = new HPSiteFlowClient();

        const orderRes = await hpClient.createOrder({
            sourceOrderId: sourceOrderId,
            items: [{
                sourceItemId: `item-${sourceOrderId}`,
                sku,
                quantity: 1,
                components: [{
                    code: "cover", // Example component code
                    path: fileUrl,
                    fetch: true
                }, {
                    code: "text", // Example component code, assuming single PDF for whole book
                    path: fileUrl,
                    fetch: true
                }]
            }],
            shippingInfo: {
                name: shippingDetails.name,
                line1: shippingDetails.address.line1,
                line2: shippingDetails.address.line2,
                city: shippingDetails.address.city,
                state: shippingDetails.address.state,
                postalCode: shippingDetails.address.postal_code,
                country: shippingDetails.address.country,
                email: user.email,
                phone: "" // Stripe might not return phone by default unless collected
            }
        });

        const ordersCollection = db.collection("orders");
        await ordersCollection.insertOne({
            sourceOrderId,
            userId: user.id,
            orderStatus: "submitted",
            hpOrderId: orderRes._id,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await usersCollection.updateOne(
            { _id: new ObjectId(user.id) },
            { $set: { orderStatus: "submitted", hpOrderId: orderRes._id, updatedAt: new Date() } }
        );

        console.log("HP Site Flow Order Created:", orderRes);
        return NextResponse.json({ success: true, order: orderRes });

    } catch (error: any) {
        console.error("Ship Book Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
