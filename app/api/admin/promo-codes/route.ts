import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export const revalidate = 60; // Cache for 60 seconds to scale for high traffic

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Stripe promotion codes
    const stripeCodes = await stripe.promotionCodes.list({
      limit: 100,
      expand: ["data.coupon"],
    });

    // Get MongoDB metadata (bannerActive, startDate, stripeId)
    const db = await getDatabase();
    const dbCodes = await db.collection("promo_codes").find({}).toArray();

    // Merge Stripe data with MongoDB metadata (supports both old `id` and new `stripeId` field)
    const merged = stripeCodes.data
      .map((sc) => {
        const dbEntry = dbCodes.find(
          (d) => d.stripeId === sc.id || d.id === sc.id
        );
        return {
          ...sc,
          bannerActive: dbEntry?.bannerActive === true, // strict boolean check
          startDate: dbEntry?.startDate ?? null,
          dbId: dbEntry?._id?.toString() ?? null,
        };
      })
      .filter((m) => {
        // Hide codes that are inactive AND not in MongoDB (meaning they were deleted)
        if (!m.active && !m.dbId) return false;
        return true;
      });

    return NextResponse.json({ promoCodes: merged }, { status: 200 });
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

    const { code, type, value, name, startDate, expireDate } = await req.json();

    // 1. Create a Coupon in Stripe
    const couponParams: any = {
      name: name || code,
      duration: "forever",
    };

    if (type === "percentage") {
      couponParams.percent_off = value;
    } else {
      couponParams.amount_off = value * 100;
      couponParams.currency = "usd";
    }

    const coupon = await stripe.coupons.create(couponParams);

    // 2. Create a Promotion Code for that Coupon
    const promoParams: any = {
      coupon: coupon.id,
      code: code.toUpperCase(),
    };
    
    if (expireDate) {
       promoParams.expires_at = Math.floor(new Date(expireDate).getTime() / 1000);
    }

    const promoCode = await stripe.promotionCodes.create(promoParams);

    // 3. Store in MongoDB with extra fields
    const db = await getDatabase();
    await db.collection("promo_codes").insertOne({
      stripeId: promoCode.id,
      stripeCouponId: coupon.id,
      code: code.toUpperCase(),
      type,
      value,
      startDate: startDate || null,
      bannerActive: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ promoCode }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating promo code:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
