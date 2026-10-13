/**
 * Resolves courier tracking URLs for DHL, Royal Mail, FedEx, UPS, etc.
 */
export function getCarrierTrackingUrl(trackingNumber: string, carrier?: string): string {
  if (!trackingNumber) return "";
  const cleanTrack = encodeURIComponent(trackingNumber.trim());
  const c = (carrier || "").toLowerCase();

  if (c.includes("dhl")) {
    return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${cleanTrack}`;
  }
  if (c.includes("royal") || c.includes("rm") || c.includes("parcelforce")) {
    return `https://www.royalmail.com/track-your-item#/tracking-results/${cleanTrack}`;
  }
  if (c.includes("fedex")) {
    return `https://www.fedex.com/fedextrack/?trknbr=${cleanTrack}`;
  }
  if (c.includes("ups")) {
    return `https://www.ups.com/track?tracknum=${cleanTrack}`;
  }
  if (c.includes("usps")) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${cleanTrack}`;
  }
  // Default to DHL Worldwide Express tracker
  return `https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id=${cleanTrack}`;
}

export function formatCarrierName(carrier?: string): string {
  if (!carrier) return "DHL Worldwide Express";
  const c = carrier.toLowerCase();
  if (c.includes("dhl")) return "DHL Express";
  if (c.includes("royal") || c.includes("rm")) return "Royal Mail";
  if (c.includes("fedex")) return "FedEx";
  if (c.includes("ups")) return "UPS";
  if (c === "standard" || c === "international") return "DHL Worldwide Express";
  return carrier;
}
