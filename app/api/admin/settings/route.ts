import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { adminAuthMiddleware } from "@/lib/admin-auth";
import { PlatformSettings } from "@/types/settings";

const DEFAULT_SETTINGS: PlatformSettings = {
  pricing: {
    hardCopyPrice: 3500,
    softCopyPrice: 2000,
    stickerPrice: 500,
    extraSpreadPrice: 500,
    extraStickerPrice: 500,
    markupPercentage: 20,
  },
  countries: [
    { code: "US", name: "United States", shippingRate: 0, enabled: true },
    { code: "CA", name: "Canada", shippingRate: 1500, enabled: true },
    { code: "GB", name: "United Kingdom", shippingRate: 2000, enabled: true },
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

    // Merge with defaults to ensure all fields are present
    const response = {
        ...DEFAULT_SETTINGS,
        ...settings,
        pricing: { ...DEFAULT_SETTINGS.pricing, ...(settings.pricing || {}) },
        countries: settings.countries || DEFAULT_SETTINGS.countries,
        print: { ...DEFAULT_SETTINGS.print, ...(settings.print || {}) },
        general: { ...DEFAULT_SETTINGS.general, ...(settings.general || {}) },
    };

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
