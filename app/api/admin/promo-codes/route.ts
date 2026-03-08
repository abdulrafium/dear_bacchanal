import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List promotion codes from Stripe
    const promoCodes = await stripe.promotionCodes.list({
      limit: 100,
      expand: ['data.coupon']
    });

    return NextResponse.json({ promoCodes: promoCodes.data }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching promo codes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, type, value, name } = await req.json();

    // 1. Create a Coupon in Stripe
    const couponParams: any = {
      name: name || code,
      duration: "forever",
    };

    if (type === "percentage") {
      couponParams.percent_off = value;
    } else {
      couponParams.amount_off = value * 100; // Stripe uses cents
      couponParams.currency = "usd";
    }

    const coupon = await stripe.coupons.create(couponParams);

    // 2. Create a Promotion Code for that Coupon
    const promoCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: code.toUpperCase(),
    });

    // Optional: Store in MongoDB
    const db = await getDatabase();
    await db.collection("promo_codes").insertOne({
      id: promoCode.id,
      stripeCouponId: coupon.id,
      code: code.toUpperCase(),
      type,
      value,
      createdAt: new Date(),
    });

    return NextResponse.json({ promoCode }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating promo code:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
