import { NextResponse } from "next/server";
import { getPlatformSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getPlatformSettings();
    
    // Sanitize settings for public consumption
    const publicSettings = {
      pricing: {
        hardCopyPrice: settings.pricing.hardCopyPrice,
        softCopyPrice: settings.pricing.softCopyPrice,
        stickerPrice: settings.pricing.stickerPrice,
        extraSpreadPrice: settings.pricing.extraSpreadPrice,
        extraStickerPrice: settings.pricing.extraStickerPrice,
      },
      countries: settings.countries.filter(c => c.enabled).map(c => ({
        code: c.code,
        name: c.name,
        zone: c.zone,
        shippingRate: c.shippingRate,
      })),
      general: {
        siteName: settings.general.siteName,
        contactEmail: settings.general.contactEmail,
        maintenanceMode: settings.general.maintenanceMode,
        exchangeRateGbpToUsd: settings.general.exchangeRateGbpToUsd,
      }
    };

    return NextResponse.json(publicSettings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
