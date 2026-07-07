import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const revalidate = 60; // Cache for 60 seconds to scale for high traffic

export async function GET() {
  try {
    const db = await getDatabase();

    // Find the active banner promo in MongoDB
    const activePromo = await db.collection("promo_codes").findOne({
      bannerActive: true,
    });

    if (!activePromo) {
      return NextResponse.json({ promo: null }, { status: 200 });
    }

    // Get the Stripe promo code ID (support both old and new field names)
    const stripeId = activePromo.stripeId || activePromo.id;

    // If we have extra info saved in MongoDB, use it directly
    if (activePromo.type && activePromo.value) {
      return NextResponse.json({
        promo: {
          code: activePromo.code,
          type: activePromo.type,
          value: activePromo.value,
          startDate: activePromo.startDate || null,
        },
      });
    }

    // Otherwise fall back to fetching from Stripe for full details
    if (stripeId) {
      try {
        const stripePromo = await stripe.promotionCodes.retrieve(stripeId, {
          expand: ["coupon"],
        });
        const coupon = (stripePromo as any).coupon;
        return NextResponse.json({
          promo: {
            code: stripePromo.code,
            type: coupon.percent_off ? "percentage" : "fixed_amount",
            value: coupon.percent_off ?? (coupon.amount_off ?? 0) / 100,
            startDate: activePromo.startDate || null,
          },
        });
      } catch {
        // Stripe lookup failed — return basic info from MongoDB
      }
    }

    return NextResponse.json({
      promo: {
        code: activePromo.code,
        type: activePromo.type || "percentage",
        value: activePromo.value || 0,
        startDate: activePromo.startDate || null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching active promo:", error);
    return NextResponse.json({ promo: null }, { status: 200 });
  }
}
