import { getDatabase } from "./db";
import { PlatformSettings } from "@/types/settings";

const DEFAULT_SETTINGS: PlatformSettings = {
  pricing: {
    hardCopyPrice: Number(process.env.STRIPE_HARD_COPY_PRICE) || 5000,
    softCopyPrice: Number(process.env.STRIPE_SOFT_COPY_PRICE) || 4000,
    stickerPrice: 500,
    extraSpreadPrice: 500,
    extraStickerPrice: 500,
    markupPercentage: 20,
  },
  countries: [
    { code: "US", name: "United States", zone: "Clear Non EU", shippingRate: 0, enabled: true },
    { code: "CA", name: "Canada", zone: "Clear Non EU", shippingRate: 1500, enabled: true },
    { code: "GB", name: "United Kingdom", zone: "Other", shippingRate: 2000, enabled: true },
    { code: "GY", name: "Guyana", zone: "Other", shippingRate: 0, enabled: true },
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

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const db = await getDatabase();
    const settings = await db.collection("settings").findOne({ id: "platform_settings" });

    if (!settings) {
      return DEFAULT_SETTINGS;
    }

    // Merge with defaults to ensure all fields are present
    return {
        ...DEFAULT_SETTINGS,
        ...settings,
        pricing: { ...DEFAULT_SETTINGS.pricing, ...(settings.pricing || {}) },
        countries: settings.countries || DEFAULT_SETTINGS.countries,
        print: { ...DEFAULT_SETTINGS.print, ...(settings.print || {}) },
        general: { ...DEFAULT_SETTINGS.general, ...(settings.general || {}) },
    };
  } catch (error) {
    console.error("Error fetching platform settings:", error);
    return DEFAULT_SETTINGS;
  }
}
