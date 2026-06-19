export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

import { getDatabase } from "@/lib/db";

import { adminAuthMiddleware } from "@/lib/admin-auth";

import { PlatformSettings } from "@/types/settings";


const DEFAULT_SETTINGS: PlatformSettings = {
  pricing: {
    hardCopyPrice: 5000,
    softCopyPrice: 4000,
    stickerPrice: 500,
    extraSpreadPrice: 500,
    extraStickerPrice: 500,
    markupPercentage: 20,
  },
  countries: [
    { code: "US", name: "United States", zone: "Clear Non EU", shippingRate: 1383, enabled: true },
    { code: "AT", name: "Austria", zone: "Clear EU", shippingRate: 903, enabled: true },
    { code: "BE", name: "Belgium", zone: "Clear EU", shippingRate: 734, enabled: true },
    { code: "BG", name: "Bulgaria", zone: "Clear EU", shippingRate: 887, enabled: true },
    { code: "HR", name: "Croatia", zone: "Clear EU", shippingRate: 1116, enabled: true },
    { code: "CY", name: "Cyprus", zone: "Clear EU", shippingRate: 1174, enabled: true },
    { code: "CZ", name: "Czech Republic", zone: "Clear EU", shippingRate: 673, enabled: true },
    { code: "DK", name: "Denmark", zone: "Clear EU", shippingRate: 843, enabled: true },
    { code: "EE", name: "Estonia", zone: "Clear EU", shippingRate: 1106, enabled: true },
    { code: "FI", name: "Finland", zone: "Clear EU", shippingRate: 1241, enabled: true },
    { code: "FR", name: "France", zone: "Clear EU", shippingRate: 792, enabled: true },
    { code: "DE", name: "Germany", zone: "Clear EU", shippingRate: 629, enabled: true },
    { code: "GR", name: "Greece", zone: "Clear EU", shippingRate: 1452, enabled: true },
    { code: "HU", name: "Hungary", zone: "Clear EU", shippingRate: 822, enabled: true },
    { code: "IE", name: "Ireland", zone: "Clear EU", shippingRate: 652, enabled: true },
    { code: "IT", name: "Italy", zone: "Clear EU", shippingRate: 785, enabled: true },
    { code: "LV", name: "Latvia", zone: "Clear EU", shippingRate: 1070, enabled: true },
    { code: "LT", name: "Lithuania", zone: "Clear EU", shippingRate: 887, enabled: true },
    { code: "LU", name: "Luxembourg", zone: "Clear EU", shippingRate: 661, enabled: true },
    { code: "MT", name: "Malta", zone: "Clear EU", shippingRate: 1364, enabled: true },
    { code: "NL", name: "Netherlands", zone: "Clear EU", shippingRate: 637, enabled: true },
    { code: "PL", name: "Poland", zone: "Clear EU", shippingRate: 622, enabled: true },
    { code: "PT", name: "Portugal", zone: "Clear EU", shippingRate: 715, enabled: true },
    { code: "RO", name: "Romania", zone: "Clear EU", shippingRate: 852, enabled: true },
    { code: "SK", name: "Slovakia", zone: "Clear EU", shippingRate: 806, enabled: true },
    { code: "SI", name: "Slovenia", zone: "Clear EU", shippingRate: 975, enabled: true },
    { code: "ES", name: "Spain", zone: "Clear EU", shippingRate: 645, enabled: true },
    { code: "SE", name: "Sweden", zone: "Clear EU", shippingRate: 975, enabled: true },
    { code: "IS", name: "Iceland", zone: "Tracked Non EU", shippingRate: 816, enabled: true },
    { code: "NO", name: "Norway", zone: "Tracked Non EU", shippingRate: 1032, enabled: true },
    { code: "CH", name: "Switzerland", zone: "Tracked Non EU", shippingRate: 889, enabled: true },
    { code: "AR", name: "Argentina", zone: "Tracked Non EU", shippingRate: 1681, enabled: true },
    { code: "AU", name: "Australia", zone: "Tracked Non EU", shippingRate: 1808, enabled: true },
    { code: "BY", name: "Belarus", zone: "Tracked Non EU", shippingRate: 1833, enabled: true },
    { code: "BR", name: "Brazil", zone: "Tracked Non EU", shippingRate: 1552, enabled: true },
    { code: "CA", name: "Canada", zone: "Tracked Non EU", shippingRate: 1587, enabled: true },
    { code: "CL", name: "Chile", zone: "Tracked Non EU", shippingRate: 2347, enabled: true },
    { code: "CN", name: "China", zone: "Tracked Non EU", shippingRate: 892, enabled: true },
    { code: "HK", name: "Hong Kong", zone: "Tracked Non EU", shippingRate: 929, enabled: true },
    { code: "IN", name: "India", zone: "Tracked Non EU", shippingRate: 1490, enabled: true },
    { code: "ID", name: "Indonesia", zone: "Tracked Non EU", shippingRate: 1622, enabled: true },
    { code: "IL", name: "Israel", zone: "Tracked Non EU", shippingRate: 1499, enabled: true },
    { code: "JP", name: "Japan", zone: "Tracked Non EU", shippingRate: 1171, enabled: true },
    { code: "MY", name: "Malaysia", zone: "Tracked Non EU", shippingRate: 1634, enabled: true },
    { code: "MX", name: "Mexico", zone: "Tracked Non EU", shippingRate: 1659, enabled: true },
    { code: "NZ", name: "New Zealand", zone: "Tracked Non EU", shippingRate: 1856, enabled: true },
    { code: "RU", name: "Russian Federation", zone: "Tracked Non EU", shippingRate: 1140, enabled: true },
    { code: "SA", name: "Saudi Arabia", zone: "Tracked Non EU", shippingRate: 1322, enabled: true },
    { code: "RS", name: "Serbia", zone: "Tracked Non EU", shippingRate: 1684, enabled: true },
    { code: "SG", name: "Singapore", zone: "Tracked Non EU", shippingRate: 999, enabled: true },
    { code: "ZA", name: "South Africa", zone: "Tracked Non EU", shippingRate: 1797, enabled: true },
    { code: "KR", name: "South Korea", zone: "Tracked Non EU", shippingRate: 877, enabled: true },
    { code: "TW", name: "Taiwan", zone: "Tracked Non EU", shippingRate: 1080, enabled: true },
    { code: "TH", name: "Thailand", zone: "Tracked Non EU", shippingRate: 1597, enabled: true },
    { code: "TR", name: "Turkey", zone: "Tracked Non EU", shippingRate: 1125, enabled: true },
    { code: "UA", name: "Ukraine", zone: "Tracked Non EU", shippingRate: 625, enabled: true },
    { code: "AE", name: "United Arab Emirates", zone: "Tracked Non EU", shippingRate: 1598, enabled: true },
    { code: "O-EU", name: "Rest of Europe", zone: "Other", shippingRate: 2733, enabled: true },
    { code: "O-ME", name: "Rest of Middle East", zone: "Other", shippingRate: 3032, enabled: true },
    { code: "O-SA", name: "Rest of C&S America", zone: "Other", shippingRate: 3224, enabled: true },
    { code: "O-AS", name: "Rest of Far East & Asia", zone: "Other", shippingRate: 2928, enabled: true },
    { code: "O-AF", name: "Rest of Africa", zone: "Other", shippingRate: 3058, enabled: true },
    { code: "O-WW", name: "Rest of World", zone: "Other", shippingRate: 3322, enabled: true }
  ],
  print: {
    apiKey: "",
    endpoint: "https://api.pureprint.com/v1",
    isLive: false,
    shippingMode: "api",
  },
  general: {
    siteName: "Dear Bacchanal",
    contactEmail: "hello@dearbacchanal.com",
    adminNotificationEmail: "admin@dearbacchanal.com",
    maintenanceMode: false,
    refundDeadlineDays: 14,
    exchangeRateGbpToUsd: 1.30,
  },
};

export async function GET(req: NextRequest) {
  const authResponse = await adminAuthMiddleware();
  if (authResponse) return authResponse;

  try {
    const db = await getDatabase();
    const settings = await db.collection("settings").findOne({ id: "platform_settings" });

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    // If the DB only has the old 3 countries, overwrite them with the full 60+ countries list
    let finalCountries = settings.countries || DEFAULT_SETTINGS.countries;
    if (finalCountries.length < 10) {
      finalCountries = DEFAULT_SETTINGS.countries;
    }

    // Merge with defaults to ensure all fields are present
    const response = {
      ...DEFAULT_SETTINGS,
      ...settings,
      pricing: { ...DEFAULT_SETTINGS.pricing, ...(settings.pricing || {}) },
      countries: finalCountries,
      print: { ...DEFAULT_SETTINGS.print, ...(settings.print || {}) },
      general: { ...DEFAULT_SETTINGS.general, ...(settings.general || {}) },
    };

    // Make sure we carry over the new exchange rate if not present in db
    if (response.general.exchangeRateGbpToUsd === undefined) {
      response.general.exchangeRateGbpToUsd = DEFAULT_SETTINGS.general.exchangeRateGbpToUsd;
    }

    // Remove MongoDB internal ID for clean serialization
    const cleanResponse = { ...response };
    delete (cleanResponse as any)._id;

    return NextResponse.json(cleanResponse);
  } catch (error: any) {
    console.error("Settings GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResponse = await adminAuthMiddleware();
  if (authResponse) return authResponse;

  try {
    const body = await req.json();
    const db = await getDatabase();

    // Remove _id from body if exists as it's immutable in MongoDB
    const { _id, ...updateData } = body;

    await db.collection("settings").updateOne(
      { id: "platform_settings" },
      { $set: updateData },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Settings POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
