import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

import { stripe } from "@/lib/stripe";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (
      !session?.user?.id &&
      !session?.user?.email &&
      process.env.NODE_ENV !== "development"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bannerActive } = await req.json();
    const db = await getDatabase();

    // Step 1: Update Stripe
    await stripe.promotionCodes.update(id, { active: bannerActive });

    // Step 2: Always deactivate ALL banners first (guarantees only-one-active)
    if (bannerActive) {
      await db.collection("promo_codes").updateMany(
        {},
        { $set: { bannerActive: false } }
      );
    }

    // Step 3: Update MongoDB
    const existing = await db.collection("promo_codes").findOne({
      $or: [{ stripeId: id }, { id: id }],
    });

    if (existing) {
      await db.collection("promo_codes").updateOne(
        { _id: existing._id },
        { $set: { bannerActive: bannerActive, active: bannerActive, stripeId: id } }
      );
    } else {
      await db.collection("promo_codes").insertOne({
        stripeId: id,
        bannerActive: bannerActive,
        active: bannerActive,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, bannerActive });
  } catch (error: any) {
    console.error("Error toggling promo banner:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
