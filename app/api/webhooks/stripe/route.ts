import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendEmail } from "@/lib/mail-service";
import { getOrderConfirmationEmail } from "@/lib/email-templates";
import { generateInvoicePDF } from "@/lib/pdf-generator";

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
            const ordersCollection = db.collection("orders");

            // Extract metadata
            const orderType = session.metadata?.orderType || 'soft';
            const amountTotal = session.amount_total || 0;
            const currency = session.currency || 'usd';

            let dbUserId = null;

            if (userId) {
                const userDoc = await usersCollection.findOneAndUpdate(
                    { _id: new ObjectId(userId) },
                    {
                        $set: {
                            isPurchased: true,
                            shippingDetails: shippingDetails ?? undefined,
                            updatedAt: new Date(),
                        },
                    },
                    { returnDocument: 'after' }
                );
                dbUserId = userDoc ? userDoc._id : userId;
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
                    dbUserId = existing._id;
                } else {
                    const result = await usersCollection.insertOne({
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
                    dbUserId = result.insertedId;
                }
                console.log(`Guest user ${email} created/updated via webhook`);
            }

            // CREATE ORDER RECORD
            const orderRecord = {
                userId: dbUserId,
                email: email,
                orderId: session.id,
                amount: amountTotal,
                currency: currency,
                type: orderType,
                templateName: session.metadata?.templateName || '',
                bookId: session.metadata?.bookId || '',
                status: orderType === 'hard' ? 'processing' : 'paid',
                shippingDetails: shippingDetails || null,
                paymentMethod: session.payment_method_types?.[0] || 'card',
                customerName: session.customer_details?.name || shippingDetails?.name || email?.split('@')[0] || '',
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await ordersCollection.insertOne(orderRecord);
            console.log(`Order record created for session ${session.id}`);

            // TRIGGER PRINT API FOR HARD COPIES
            if (orderType === 'hard') {
                try {
                    const { HPSiteFlowClient } = await import("@/lib/hp-site-flow");
                    const client = new HPSiteFlowClient();
                    const shippingInfo = JSON.parse(session.metadata?.shippingAddress || "{}");
                    
                    await client.createOrder({
                        sourceOrderId: session.id,
                        items: [{
                            sourceItemId: session.metadata?.bookId || "preview",
                            sku: "hardcover_book",
                            quantity: 1,
                            components: [
                                { code: "cover", path: `${process.env.NEXTAUTH_URL || 'https://dearbacchanal.com'}/api/public/export/${session.metadata?.bookId}?type=cover`, fetch: true },
                                { code: "text", path: `${process.env.NEXTAUTH_URL || 'https://dearbacchanal.com'}/api/public/export/${session.metadata?.bookId}?type=text`, fetch: true }
                            ]
                        }],
                        shippingInfo: {
                            name: session.metadata?.shippingName || shippingInfo.name || "Customer",
                            line1: shippingInfo.line1,
                            line2: shippingInfo.line2,
                            city: shippingInfo.city,
                            state: shippingInfo.state,
                            postalCode: shippingInfo.postalCode,
                            country: shippingInfo.country,
                            email: email || "",
                            shippingMethod: shippingInfo.shippingMethod || "standard"
                        }
                    });
                    console.log(`Order ${session.id} forwarded to HP Site Flow`);
                } catch (printError) {
                    console.error("Failed to forward order to HP Site Flow:", printError);
                }
            }

            // SEND CONFIRMATION EMAIL
            if (email) {
                try {
                    // Generate PDF Invoice
                    const pdfBuffer = await generateInvoicePDF({
                        orderId: session.id,
                        date: new Date(),
                        customerName: session.customer_details?.name || "Customer",
                        customerEmail: email,
                        amount: amountTotal / 100,
                        type: orderType,
                        bookTitle: session.metadata?.templateName || "Dear Bacchanal Edition"
                    });

                    const emailHtml = getOrderConfirmationEmail({
                        orderId: session.id,
                        amount: amountTotal / 100,
                        type: orderType,
                        bookTitle: session.metadata?.templateName || "Dear Bacchanal Edition",
                        transactionId: session.id
                    });

                    await sendEmail({
                        to: email,
                        subject: `Your Dear Bacchanal Order Confirmation - ${session.id.slice(-8).toUpperCase()}`,
                        html: emailHtml,
                        attachments: [
                            {
                                filename: `Invoice-${session.id.slice(-8).toUpperCase()}.pdf`,
                                content: pdfBuffer,
                                contentType: "application/pdf"
                            }
                        ]
                    });
                    console.log(`Confirmation email with PDF sent to ${email}`);
                } catch (emailError) {
                    console.error("Failed to send confirmation email:", emailError);
                }
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
