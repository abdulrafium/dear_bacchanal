import { NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "@/lib/server-auth";
import { stripe } from "@/lib/stripe";
import { getPlatformSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
    try {
        const user = await getServerAuth();
        const body = await req.json().catch(() => ({}));
        const { pricing, countries } = await getPlatformSettings();
        const orderType = body.type || 'soft'; // 'hard' or 'soft'

        const unitAmount = orderType === 'hard' ? pricing.hardCopyPrice : pricing.softCopyPrice;
        const productName = orderType === 'hard' ? "Dear Bacchanal - Hard Copy (+ Shipping)" : "Dear Bacchanal - Soft Copy (Digital)";

        let lineItems: any[] = [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: productName,
                    },
                    unit_amount: unitAmount,
                },
                quantity: 1,
            }
        ];

        // ADD-ONS CALCULATION
        if (body.bookId && body.bookId !== "undefined") {
            try {
                const { getDatabase } = await import("@/lib/db");
                const { ObjectId } = await import("mongodb");
                const db = await getDatabase();
                const book = await db.collection("user_books").findOne({ 
                    _id: body.bookId.length === 24 ? new ObjectId(body.bookId) : body.bookId 
                });
                
                if (book) {
                    const spreadsCount = book.spreads?.length || 0;
                    // Count stickers across all pages
                    const stickersCount = book.spreads?.reduce((acc: number, s: any) => {
                        const leftStickers = s.leftPage?.elements?.filter((e: any) => e.type === 'sticker')?.length || 0;
                        const rightStickers = s.rightPage?.elements?.filter((e: any) => e.type === 'sticker')?.length || 0;
                        return acc + leftStickers + rightStickers;
                    }, 0) || 0;

                    // Base price includes first 16 spreads (32 pages)
                    if (spreadsCount > 16) {
                        lineItems.push({
                            price_data: {
                                currency: 'usd',
                                product_data: { 
                                    name: "Additional Spreads (Pages Pack)",
                                    description: `Added ${spreadsCount - 16} extra spreads`
                                },
                                unit_amount: pricing.extraSpreadPrice || 500,
                            },
                            quantity: spreadsCount - 16,
                        });
                    }

                    // Stickers are FREE - no charge
                }
            } catch (calcError) {
                console.error("Add-on calculation failed, falling back to base price:", calcError);
            }
        }

        // SHIPPING CALCULATION
        if (orderType === 'hard' && body.shippingRate) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: { 
                        name: "Shipping & Handling",
                        description: `Delivery to ${body.shippingInfo?.country || 'International'}`
                    },
                    unit_amount: body.shippingRate,
                },
                quantity: 1,
            });
        }

        // Determine Base URL dynamically to support multiple domains (Vercel + Custom)
        const host = req.headers.get("host");
        const protocol = host?.includes("localhost") ? "http" : "https";
        const baseUrl = host ? `${protocol}://${host}` : process.env.NEXTAUTH_URL || "http://localhost:3000";
        const checkoutSessionOptions: any = {
            mode: "payment",
            payment_method_types: ["card"],
            allow_promotion_codes: true,
            line_items: lineItems,
            success_url: `${baseUrl}/editor/payment-status?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/editor/payment-status?canceled=true`,
            ...(user?.email
                ? { 
                    customer_email: user.email, 
                    metadata: { 
                        userId: user.id, 
                        orderType,
                        templateName: body.templateName || "",
                        bookId: body.bookId || "",
                        shippingName: body.shippingInfo?.name || "",
                        shippingAddress: JSON.stringify(body.shippingInfo || {})
                    } 
                  }
                : { 
                    metadata: { 
                        orderType,
                        templateName: body.templateName || "",
                        bookId: body.bookId || "",
                        shippingName: body.shippingInfo?.name || "",
                        shippingAddress: JSON.stringify(body.shippingInfo || {})
                    } 
                  }),
        };

        if (orderType === 'hard') {
            const allowedCountries = countries
                .filter(c => c.enabled && c.code && c.code.length === 2)
                .map(c => c.code);
            checkoutSessionOptions.shipping_address_collection = {
                allowed_countries: allowedCountries.length > 0 ? allowedCountries : ["US", "CA", "GB"],
            };
        }


        const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionOptions);

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
