import { jsPDF } from "jspdf";

export interface InvoiceAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface InvoiceData {
  orderId: string;
  invoiceNumber?: string;
  transactionRef?: string;
  date: Date | string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: InvoiceAddress;
  amount: number;
  subtotal?: number;
  processing?: number;
  type: string; // 'hard' or 'soft'
  bookTitle?: string;
  paymentMethod?: string;
}

/**
 * Executes a callback within a rotated coordinate context around a center point (cx, cy) in mm.
 * Preserves the graphics state and resets it cleanly.
 */
function withRotation(
  doc: jsPDF,
  cxMm: number,
  cyMm: number,
  angleDeg: number,
  drawFn: () => void
) {
  const k = doc.internal.scaleFactor;
  const pageH = doc.internal.pageSize.getHeight();
  const cx = cxMm * k;
  const cy = (pageH - cyMm) * k;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  doc.saveGraphicsState();
  const m = new (doc as any).Matrix(
    cos,
    sin,
    -sin,
    cos,
    cx - cx * cos + cy * sin,
    cy - cx * sin - cy * cos
  );
  doc.setCurrentTransformationMatrix(m);
  drawFn();
  doc.restoreGraphicsState();
}

export const generateInvoicePDF = async (data: InvoiceData): Promise<Buffer> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // ─── COLOR PALETTE (Exact match to Order Page & Admin Dashboard) ─────────────
  const darkRed = [159, 46, 43];        // #9f2e2b
  const primaryRed = [190, 40, 38];     // #be2826
  const secondaryGold = [236, 181, 43]; // #ecb52b
  const black = [17, 17, 17];           // #111111
  const darkGray = [55, 65, 81];        // #374151
  const midGray = [107, 114, 128];      // #6b7280
  const lightMuted = [156, 163, 175];   // #9ca3af
  const borderGray = [229, 231, 235];   // #e5e7eb
  const cardBg = [249, 250, 251];       // #f9fafb
  const white = [255, 255, 255];
  const emerald = [5, 150, 105];        // #059669
  const emeraldBg = [240, 253, 244];    // #f0fdf4 (emerald-500/5 tint)

  // ─── 1. TOP DECORATIVE GRADIENT STRIPE (Y: 0 to 3.5mm) ─────────────────────
  doc.setFillColor(darkRed[0], darkRed[1], darkRed[2]);
  doc.rect(0, 0, 70, 3.5, "F");
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.rect(70, 0, 70, 3.5, "F");
  doc.setFillColor(secondaryGold[0], secondaryGold[1], secondaryGold[2]);
  doc.rect(140, 0, 70, 3.5, "F");

  // ─── 2. HEADER: ROTATED BRAND LOGO & INVOICE DETAILS ───────────────────────
  // Left: Rotated Brand Logo Box "DB" (-3 degrees tilt with white border & shadow)
  withRotation(doc, 29, 24, -3, () => {
    // Subtle drop shadow
    doc.setFillColor(215, 220, 228);
    doc.roundedRect(20.5, 15.5, 17.5, 17.5, 4, 4, "F");
    // Outer white border (border-4 border-white)
    doc.setFillColor(white[0], white[1], white[2]);
    doc.roundedRect(20, 15, 18, 18, 4, 4, "F");
    // Inner red brand fill (#be2826)
    doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.roundedRect(20.8, 15.8, 16.4, 16.4, 3.5, 3.5, "F");
    // DB monogram text
    doc.setTextColor(white[0], white[1], white[2]);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.text("DB", 29, 26.6, { align: "center" });
  });

  // Left: Brand Typography (Exact bold-italic uppercase from order page)
  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(18);
  doc.text("DEAR", 43, 21.5);
  doc.text("BACCHANAL", 43, 28);

  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.text("P R E M I U M   K E E P S A K E S", 43, 33.5);

  // Right: Invoice Title & Number
  const invoiceNum =
    data.invoiceNumber ||
    `INV-${(data.orderId || "").slice(-6).toUpperCase() || "RECEIPT"}`;

  const invoiceDate =
    typeof data.date === "string" ? new Date(data.date) : data.date || new Date();
  const formattedDate = invoiceDate.toLocaleDateString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  });

  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 190, 22, { align: "right" });

  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text(invoiceNum, 190, 28, { align: "right" });

  doc.setTextColor(midGray[0], midGray[1], midGray[2]);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text(formattedDate.toUpperCase(), 190, 33.5, { align: "right" });

  // Top Section Divider
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.line(20, 39, 190, 39);

  // ─── 3. BILLED TO & FROM TWO-COLUMN SECTION (Y: 44 to 82mm) ─────────────────
  // Subtle middle vertical divider
  doc.setDrawColor(240, 242, 245);
  doc.line(105, 43, 105, 83);

  // ── LEFT COLUMN: BILLED TO ──
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.circle(21.5, 47.5, 1.2, "F");

  doc.setTextColor(lightMuted[0], lightMuted[1], lightMuted[2]);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("B I L L E D   T O", 25, 48.5);

  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName || "Valued Customer", 20, 56);

  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerEmail || "", 20, 61);

  let leftAddrY = 66;
  if (data.customerPhone) {
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.text(`Tel: ${data.customerPhone}`, 20, leftAddrY);
    leftAddrY += 4.5;
  }

  // Address
  const addr = data.shippingAddress;
  doc.setTextColor(midGray[0], midGray[1], midGray[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");

  if (addr && (addr.line1 || addr.city)) {
    if (addr.line1) {
      doc.text(addr.line1, 20, leftAddrY);
      leftAddrY += 4;
    }
    if (addr.line2) {
      doc.text(addr.line2, 20, leftAddrY);
      leftAddrY += 4;
    }
    const cityStateZip = [addr.city, addr.state, addr.postal_code]
      .filter(Boolean)
      .join(", ");
    if (cityStateZip) {
      doc.text(cityStateZip, 20, leftAddrY);
      leftAddrY += 4;
    }
    if (addr.country) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
      doc.text(addr.country.toUpperCase(), 20, leftAddrY);
    }
  } else {
    doc.text(
      data.type === "hard"
        ? "Address on file"
        : "Digital Delivery (Instant Access)",
      20,
      leftAddrY
    );
    leftAddrY += 4;
    doc.text(
      data.type === "hard"
        ? "Standard Delivery"
        : "Direct Download via Customer Account",
      20,
      leftAddrY
    );
  }

  // ── RIGHT COLUMN: FROM ──
  doc.setFillColor(secondaryGold[0], secondaryGold[1], secondaryGold[2]);
  doc.circle(111.5, 47.5, 1.2, "F");

  doc.setTextColor(lightMuted[0], lightMuted[1], lightMuted[2]);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("F R O M", 115, 48.5);

  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Dear Bacchanal Ltd.", 110, 56);

  doc.setTextColor(midGray[0], midGray[1], midGray[2]);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("billing@dearbacchanal.com", 110, 61);

  doc.setFontSize(8);
  doc.text("123 Carnival Way", 110, 66);
  doc.text("Port of Spain, Trinidad & Tobago", 110, 70.5);

  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("TAX ID: DB-TR-2026-X", 110, 75.5);

  // ─── 4. ITEMS TABLE CARD (Y: 86 to 130mm) ──────────────────────────────────
  const tableTop = 86;
  const tableHeight = 42;
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(20, tableTop, 170, tableHeight, 3.5, 3.5, "FD");

  // Table Headers
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", 26, tableTop + 8);
  doc.text("QTY", 135, tableTop + 8, { align: "center" });
  doc.text("AMOUNT", 184, tableTop + 8, { align: "right" });

  doc.setDrawColor(230, 233, 238);
  doc.setLineWidth(0.3);
  doc.line(26, tableTop + 11, 184, tableTop + 11);

  // Item Row
  const itemDescription =
    data.type === "hard"
      ? "Dear Bacchanal - Hardcover Heirloom Edition"
      : "Dear Bacchanal - Digital PDF Edition";

  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.text(itemDescription, 26, tableTop + 19);

  // Badges under item
  const templateName = (
    data.bookTitle ||
    "Dear Bacchanal Edition"
  ).toUpperCase();
  const isHard = data.type === "hard";

  // Badge 1: Template Name (Red Pill)
  const templateBadgeWidth = Math.min(
    65,
    Math.max(26, templateName.length * 2.1 + 6)
  );
  doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.roundedRect(26, tableTop + 23, templateBadgeWidth, 5.5, 1.2, 1.2, "F");
  doc.setTextColor(white[0], white[1], white[2]);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text(
    templateName.length > 25 ? templateName.slice(0, 23) + "..." : templateName,
    26 + templateBadgeWidth / 2,
    tableTop + 26.8,
    { align: "center" }
  );

  // Badge 2: Type (Black Pill: Hardcover or Digital PDF)
  const typeText = isHard ? "HARDCOVER" : "DIGITAL PDF";
  const typeBadgeX = 26 + templateBadgeWidth + 3;
  const typeBadgeWidth = isHard ? 24 : 26;
  doc.setFillColor(black[0], black[1], black[2]);
  doc.roundedRect(typeBadgeX, tableTop + 23, typeBadgeWidth, 5.5, 1.2, 1.2, "F");
  doc.setTextColor(white[0], white[1], white[2]);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text(typeText, typeBadgeX + typeBadgeWidth / 2, tableTop + 26.8, {
    align: "center",
  });

  // QTY
  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("1", 135, tableTop + 24, { align: "center" });

  // Amount
  const bookSubtotal = data.subtotal ?? (data.amount - (data.processing || 0));
  doc.setFontSize(12.5);
  doc.setFont("helvetica", "bold");
  doc.text(`$${bookSubtotal.toFixed(2)}`, 184, tableTop + 24, {
    align: "right",
  });

  // ─── 5. SUMMARY & VERIFICATION SECTION (Y: 136 to 175mm) ───────────────────
  const summaryY = 136;

  // Left Box: Payment Verified Card (Dashed Border Card)
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineDashPattern([2, 2], 0);
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.roundedRect(20, summaryY, 78, 36, 2.5, 2.5, "FD");
  doc.setLineDashPattern([], 0); // reset dash

  // Green Check Circle with Crisp Vector Checkmark
  const checkX = 29;
  const checkY = summaryY + 14;
  doc.setFillColor(34, 197, 94); // #22c55e emerald
  doc.circle(checkX, checkY, 4.2, "F");
  doc.setDrawColor(white[0], white[1], white[2]);
  doc.setLineWidth(0.65);
  doc.line(checkX - 1.8, checkY, checkX - 0.5, checkY + 1.6);
  doc.line(checkX - 0.5, checkY + 1.6, checkX + 2.0, checkY - 1.5);

  // Text inside Verified Card
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT VERIFIED", 37, summaryY + 10);

  doc.setTextColor(lightMuted[0], lightMuted[1], lightMuted[2]);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.text("TRANSACTION ID", 37, summaryY + 15);

  const txRef =
    data.transactionRef ||
    (data.orderId || "").slice(-12).toUpperCase() ||
    "CONFIRMED";
  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(9.5);
  doc.setFont("courier", "bold");
  doc.text(txRef, 37, summaryY + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(34, 197, 94);
  doc.text("STATUS: FULLY SETTLED & VERIFIED", 37, summaryY + 28);

  // Right Side: Totals Breakdown (Matching Order Page UI)
  const subtotal = data.subtotal ?? (data.amount - (data.processing || 0));
  const processingFee = data.processing ?? 0;
  const grandTotal = data.amount;

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("BOOK PRICE", 120, summaryY + 7);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(8.5);
  doc.text(`$${subtotal.toFixed(2)}`, 190, summaryY + 7, { align: "right" });

  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(8);
  doc.text("PROCESSING & DELIVERY", 120, summaryY + 13.5);
  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(8.5);
  doc.text(`$${processingFee.toFixed(2)}`, 190, summaryY + 13.5, {
    align: "right",
  });

  // Black Divider Bar
  doc.setDrawColor(black[0], black[1], black[2]);
  doc.setLineWidth(1.0);
  doc.line(120, summaryY + 18, 190, summaryY + 18);

  // Grand Total Line
  doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("G R A N D   T O T A L", 120, summaryY + 24);

  doc.setTextColor(black[0], black[1], black[2]);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`$${grandTotal.toFixed(2)}`, 190, summaryY + 27, {
    align: "right",
  });

  const methodText = (data.paymentMethod || "CARD").toUpperCase();
  doc.setTextColor(lightMuted[0], lightMuted[1], lightMuted[2]);
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "italic");
  doc.text(`PAID VIA ${methodText} GATEWAY`, 190, summaryY + 33, {
    align: "right",
  });

  // ─── 6. BIG ROTATED OFFICIAL GREEN "PAID" STAMP ────────────────────────────
  // Exactly matching the Order Page stamp (-12 degrees rotated, double border)
  withRotation(doc, 105, 198, -12, () => {
    const stampW = 86;
    const stampH = 25;
    const stampX = 105 - stampW / 2;
    const stampY = 198 - stampH / 2;

    // Tinted mint/emerald background
    doc.setFillColor(emeraldBg[0], emeraldBg[1], emeraldBg[2]);
    doc.roundedRect(stampX, stampY, stampW, stampH, 4, 4, "F");

    // Outer double border
    doc.setDrawColor(emerald[0], emerald[1], emerald[2]);
    doc.setLineWidth(0.9);
    doc.roundedRect(stampX, stampY, stampW, stampH, 4, 4, "D");

    // Inner double border
    doc.setLineWidth(0.35);
    doc.roundedRect(
      stampX + 1.2,
      stampY + 1.2,
      stampW - 2.4,
      stampH - 2.4,
      3,
      3,
      "D"
    );

    // "P A I D" Monospace Bold Text
    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.setFont("courier", "bold");
    doc.setFontSize(26);
    doc.text("P  A  I  D", 105, 195.5, { align: "center" });

    // Inner divider line
    doc.setDrawColor(emerald[0], emerald[1], emerald[2]);
    doc.setLineWidth(0.3);
    doc.line(stampX + 8, 198.5, stampX + stampW - 8, 198.5);

    // "OFFICIAL VERIFIED RECEIPT" Subtitle
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text("OFFICIAL VERIFIED RECEIPT", 105, 203.2, { align: "center" });
  });

  // ─── 7. AUTHENTICITY FOOTER (Y: 260 to 276mm) ──────────────────────────────
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.3);
  doc.line(20, 260, 190, 260);

  // Tagline (Left)
  doc.setTextColor(midGray[0], midGray[1], midGray[2]);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("KEEP THE SPIRIT ALIVE.", 20, 268);
  doc.text("BACCHANAL NEVER ENDS.", 20, 272.5);

  // Authentic Pill Badge (Right)
  // "Authentic" text + green checkmark
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("AUTHENTIC", 116, 270.5);

  const authCheckX = 132;
  const authCheckY = 269;
  doc.setFillColor(34, 197, 94);
  doc.circle(authCheckX, authCheckY, 2.2, "F");
  doc.setDrawColor(white[0], white[1], white[2]);
  doc.setLineWidth(0.5);
  doc.line(authCheckX - 1.0, authCheckY, authCheckX - 0.3, authCheckY + 0.9);
  doc.line(authCheckX - 0.3, authCheckY + 0.9, authCheckX + 1.1, authCheckY - 0.9);

  // Black Badge: "OFFICIAL PROPERTY OF DEAR BACCHANAL"
  doc.setFillColor(black[0], black[1], black[2]);
  doc.roundedRect(138, 266, 52, 7, 3.5, 3.5, "F");
  doc.setTextColor(white[0], white[1], white[2]);
  doc.setFontSize(5.8);
  doc.setFont("helvetica", "bold");
  doc.text("OFFICIAL PROPERTY OF DEAR BACCHANAL", 164, 270.8, {
    align: "center",
  });

  // ─── 8. BOTTOM SEGMENTED STRIPE (Y: 293 to 297mm) ──────────────────────────
  const segW = 210 / 6; // 35mm each
  const segColors = [
    primaryRed,
    secondaryGold,
    black,
    primaryRed,
    secondaryGold,
    black,
  ];

  segColors.forEach((color, idx) => {
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(idx * segW, 293, segW, 4, "F");
  });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
};
