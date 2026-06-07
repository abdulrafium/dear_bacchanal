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
    const doc = new jsPDF();

    // COLORS
    const primaryRed = [217, 46, 32];
    const teal = [40, 138, 124];
    const black = [0, 0, 0];

    // HEADER
    doc.setFillColor(black[0], black[1], black[2]);
    doc.rect(0, 0, 210, 40, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.text("DEAR BACCHANAL", 10, 25);
    
    doc.setFontSize(10);
    doc.text("THE ULTIMATE CARNIVAL EXPERIENCE", 10, 32);

    // INVOICE TITLE
    doc.setTextColor(black[0], black[1], black[2]);
    doc.setFontSize(22);
    doc.text("INVOICE", 150, 60);
    
    // DETAILS box
    doc.setFontSize(10);
    doc.text(`Order ID: #${data.orderId.slice(-8).toUpperCase()}`, 10, 60);
    doc.text(`Date: ${data.date.toLocaleDateString()}`, 10, 65);
    
    // CUSTOMER
    doc.setFontSize(12);
    doc.text("BILL TO:", 10, 85);
    doc.setFontSize(10);
    doc.text(data.customerName, 10, 92);
    doc.text(data.customerEmail, 10, 97);

    // TABLE HEADER
    doc.setFillColor(240, 240, 240);
    doc.rect(10, 110, 190, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIPTION", 15, 117);
    doc.text("TOTAL", 170, 117);

    // TABLE ROW
    doc.setFont("helvetica", "normal");
    const itemDesc = `Dear Bacchanal - ${data.type === 'hard' ? 'Hardcover Heirloom' : 'Digital Edition'} (${data.bookTitle || 'Untitled Version'})`;
    doc.text(itemDesc, 15, 130);
    doc.text(`$${data.amount.toFixed(2)}`, 170, 130);

    // FOOTER RECT
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 140, 200, 140);
    
    // TOTAL
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL PAID", 120, 155);
    doc.text(`$${data.amount.toFixed(2)}`, 170, 155);

    // BRANDING
    doc.setTextColor(primaryRed[0], primaryRed[1], primaryRed[2]);
    doc.setFontSize(8);
    doc.text("THANK YOU FOR CELEBRATING WITH US!", 105, 280, { align: "center" });

    const arrayBuffer = doc.output("arraybuffer");
    return Buffer.from(arrayBuffer);
};
