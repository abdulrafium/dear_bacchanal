import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";



export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth(); // Corrected 'wait auth()' to 'await auth()'
    if (!session?.user?.id && !session?.user?.email && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const promoCodeId = id;

    // Deactivate in Stripe
    await stripe.promotionCodes.update(promoCodeId, { active: false });

    // Mark as inactive in MongoDB
    const db = await getDatabase();
    await db.collection("promo_codes").updateOne({ id: promoCodeId }, { $set: { active: false } });

    return NextResponse.json({ message: "Promo code deactivated successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deactivating promo code:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
