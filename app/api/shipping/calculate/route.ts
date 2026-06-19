import { NextRequest, NextResponse } from "next/server";
import { HPSiteFlowClient } from "@/lib/hp-site-flow";
import { getPlatformSettings } from "@/lib/settings";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { shippingInfo, items } = body;

        if (!shippingInfo || !items || items.length === 0) {
            return NextResponse.json({ error: "Missing shipping info or items" }, { status: 400 });
        }

        const settings = await getPlatformSettings();
        
        // If shipping mode is manual, use the country settings
        if (settings.print.shippingMode === 'manual') {
            const country = settings.countries.find(c => c.code === shippingInfo.country);
            if (!country || !country.enabled) {
                return NextResponse.json({ error: "Shipping to this country is not available" }, { status: 400 });
            }
            return NextResponse.json({ 
                success: true, 
                rate: country.shippingRate,
                mode: 'manual',
                carrier: 'Standard Shipping'
            });
        }

        // If shipping mode is API (OneFlow)
        const client = new HPSiteFlowClient();
        
        // Mocking the behavior if validateOrder doesn't return rates
        // Actually OneFlow returning rates is dependent on setup.
        // For now we try to validate it.
        try {
            const validation = await client.validateOrder({
                sourceOrderId: "S" + Date.now(),
                items: items,
                shippingInfo: shippingInfo
            });

            // If OneFlow doesn't provide the rate, we fall back to manual or throw
            if (validation.errors) {
                return NextResponse.json({ error: "Invalid shipping address for print", details: validation.errors }, { status: 400 });
            }

            let finalRate = validation.shippingRate;
            let mode = "api";
            let carrier = validation.carrier || "Standard Carrier";

            if (validation.unsupported || finalRate === undefined) {
                 // PurePrint doesn't support live calculations, so we ALWAYS use flat rates
                 const fallbackCountry = settings.countries.find(c => c.code === shippingInfo.country);
                 finalRate = fallbackCountry?.shippingRate ?? 1500;
                 mode = "manual";
            }

            return NextResponse.json({ 
                success: true, 
                rate: finalRate,
                mode: mode,
                carrier: carrier
            });
        } catch (apiError) {
            console.error("Print API Shipping Error:", apiError);
            // Fallback to manual if API fails but manual rates exist
            const fallbackCountry = settings.countries.find(c => c.code === shippingInfo.country);
            if (fallbackCountry && fallbackCountry.enabled) {
                return NextResponse.json({ 
                    success: true, 
                    rate: fallbackCountry.shippingRate,
                    mode: 'fallback',
                    carrier: 'Standard Shipping'
                });
            }
            throw apiError;
        }

    } catch (error: any) {
        console.error("Calculate shipping error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
