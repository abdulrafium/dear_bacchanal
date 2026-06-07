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
  shippingRate: number;
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
}

export interface PlatformSettings {
  pricing: PricingSettings;
  countries: CountrySetting[];
  print: PrintSettings;
  general: GeneralSettings;
}
