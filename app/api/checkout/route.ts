import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        const user = session?.user;

        const body = await req.json().catch(() => ({}));
        const orderType = body.type || 'soft'; // 'hard' or 'soft'

        const unitAmount = orderType === 'hard' ? 3500 : 2500;
        const productName = orderType === 'hard' ? "Dear Bacchanal - Hard Copy (+ Shipping)" : "Dear Bacchanal - Soft Copy (Digital)";

        const baseUrl = process.env.NEXTAUTH_URL || "";
        const checkoutSessionOptions: any = {
            mode: "payment",
            payment_method_types: ["card"],
            allow_promotion_codes: true,
            line_items: [
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
            ],
            success_url: `${baseUrl}/book/payment-status?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/book/payment-status?canceled=true`,
            ...(user?.email
                ? { customer_email: user.email, metadata: { userId: user.id, orderType } }
                : { metadata: { orderType } }),
        };

        if (orderType === 'hard') {
            checkoutSessionOptions.shipping_address_collection = {
                allowed_countries: ["US", "CA", "GB"],
            };
        }

        const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionOptions);

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error("Stripe Checkout Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
