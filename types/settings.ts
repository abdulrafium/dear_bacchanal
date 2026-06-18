export interface PricingSettings {
  hardCopyPrice: number;
  softCopyPrice: number;
  stickerPrice: number;
  extraSpreadPrice: number;
  extraStickerPrice: number;
  markupPercentage: number;
}

export interface CountrySetting {
  code: string;
  name: string;
  zone: 'Clear EU' | 'Clear Non EU' | 'Tracked Non EU' | 'Other';
  shippingRate: number; // Stored in GBP pence (from excel sheet)
  enabled: boolean;
}

export interface PrintSettings {
  apiKey: string;
  endpoint: string;
  isLive: boolean;
  shippingMode: 'manual' | 'api';
}

export interface GeneralSettings {
  siteName: string;
  contactEmail: string;
  adminNotificationEmail: string;
  maintenanceMode: boolean;
  refundDeadlineDays: number;
  exchangeRateGbpToUsd: number; // e.g., 1.30
}

export interface PlatformSettings {
  pricing: PricingSettings;
  countries: CountrySetting[];
  print: PrintSettings;
  general: GeneralSettings;
}
