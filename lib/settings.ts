import { getDatabase } from "./db";
import { PlatformSettings } from "@/types/settings";

const DEFAULT_SETTINGS: PlatformSettings = {
  pricing: {
    hardCopyPrice: Number(process.env.STRIPE_HARD_COPY_PRICE) || 3500,
    softCopyPrice: Number(process.env.STRIPE_SOFT_COPY_PRICE) || 2000,
    stickerPrice: 500,
    extraSpreadPrice: 500,
    extraStickerPrice: 500,
    markupPercentage: 20,
  },
  countries: [
    { code: "US", name: "United States", shippingRate: 0, enabled: true },
    { code: "CA", name: "Canada", shippingRate: 1500, enabled: true },
    { code: "GB", name: "United Kingdom", shippingRate: 2000, enabled: true },
    { code: "GY", name: "Guyana", shippingRate: 0, enabled: true },
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
