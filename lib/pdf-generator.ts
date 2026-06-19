import { jsPDF } from "jspdf";

interface InvoiceData {
    orderId: string;
    date: Date;
    customerName: string;
    customerEmail: string;
    amount: number;
    type: string;
    bookTitle?: string;
}

export const generateInvoicePDF = async (data: InvoiceData): Promise<Buffer> => {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // COLORS
    const primaryRed = [190, 40, 38];
    const secondaryYellow = [236, 181, 43];
    const black = [17, 17, 17];
    const grayText = [136, 136, 136];
    const lightGray = [249, 249, 249];

    // TOP DECORATIVE STRIPE
    doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.rect(0, 0, 105, 4, "F");
    doc.setFillColor(secondaryYellow[0], secondaryYellow[1], secondaryYellow[2]);
    doc.rect(105, 0, 105, 4, "F");

    // LOGO BOX "DB"
    doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.roundedRect(20, 20, 24, 24, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("DB", 32, 36, { align: "center" });

    // "DEAR BACCHANAL"
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(20);
    doc.text("DEAR BACCHANAL", 50, 30);
    doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.setFontSize(8);
    doc.text("PREMIUM KEEPSAKES", 50, 36);

    // "RECEIPT" (Right Aligned)
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(26);
    doc.text("RECEIPT", 190, 30, { align: "right" });
    doc.setFontSize(10);
    doc.text(`#${data.orderId.slice(-8).toUpperCase()}`, 190, 37, { align: "right" });
    doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.setFontSize(8);
    doc.text(data.date.toLocaleDateString(), 190, 42, { align: "right" });

    // BILLED TO & FROM
    // Left side
    doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.circle(21, 64, 1.5, "F");
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.setFontSize(8);
    doc.text("BILLED TO", 25, 65);
    
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(12);
    doc.text(data.customerName || "Customer", 20, 72);
    doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.setFontSize(10);
    doc.text(data.customerEmail || "", 20, 77);

    // Right side
    doc.setFillColor(secondaryYellow[0], secondaryYellow[1], secondaryYellow[2]);
    doc.circle(111, 64, 1.5, "F");
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.setFontSize(8);
    doc.text("FROM", 115, 65);

    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(12);
    doc.text("Dear Bacchanal Ltd.", 110, 72);
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.setFontSize(10);
    doc.text("billing@dearbacchanal.com", 110, 77);
    
    // Middle Divider Line
    doc.setDrawColor(230, 230, 230);
    doc.line(100, 60, 100, 85);

    // TABLE BACKGROUND
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(20, 100, 170, 40, 3, 3, "F");

    // TABLE HEADERS
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.setFontSize(8);
    doc.text("DESCRIPTION", 25, 108);
    doc.text("TOTAL", 185, 108, { align: "right" });
    doc.setDrawColor(230, 230, 230);
    doc.line(25, 112, 185, 112);

    // TABLE CONTENT
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(12);
    doc.text(data.bookTitle || "Dear Bacchanal Edition", 25, 122);
    
    // Badge
    doc.setFillColor(black[0], black[1], black[2]);
    doc.roundedRect(25, 126, 30, 6, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.text(data.type === 'hard' ? "HARDCOVER" : "DIGITAL", 40, 130, { align: "center" });

    // Total Amount
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(14);
    doc.text(`$${data.amount.toFixed(2)}`, 185, 126, { align: "right" });

    // PAYMENT VERIFIED BADGE
    doc.setDrawColor(230, 230, 230);
    doc.setLineDashPattern([2, 2], 0);
    doc.roundedRect(20, 160, 50, 15, 2, 2, "D");
    doc.setLineDashPattern([], 0); // reset
    doc.setTextColor(40, 138, 124); // teal
    doc.setFontSize(8);
    doc.text("PAYMENT VERIFIED", 45, 166, { align: "center" });
    doc.setTextColor(grayText[0], grayText[1], grayText[2]);
    doc.setFontSize(6);
    doc.text(`ID: ${(data.orderId || '').slice(-8)}`, 45, 171, { align: "center" });

    // GRAND TOTAL
    doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.setFontSize(8);
    doc.text("GRAND TOTAL", 190, 163, { align: "right" });
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(20);
    doc.text(`$${data.amount.toFixed(2)}`, 190, 172, { align: "right" });

    // FOOTER STRIPE
    doc.setFillColor(black[0], black[1], black[2]);
    doc.rect(0, 293, 105, 4, "F");
    doc.setFillColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.rect(105, 293, 105, 4, "F");

    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
};
