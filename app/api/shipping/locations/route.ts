import { NextRequest, NextResponse } from "next/server";
import { HPSiteFlowClient } from "@/lib/hp-site-flow";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const country = searchParams.get("country");
        const client = new HPSiteFlowClient();

        if (country) {
            const cities = await client.fetchCities(country);
            return NextResponse.json({ success: true, data: cities || [] });
        } else {
            const countries = await client.fetchCountries();
            return NextResponse.json({ success: true, data: countries || [] });
        }
    } catch (error: any) {
        console.error("Location fetch error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
