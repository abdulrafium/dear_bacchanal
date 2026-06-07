import dotenv from "dotenv";
import path from "path";
import { sendEmail } from "../lib/mail-service";
import { getWelcomeEmail, getOrderConfirmationEmail } from "../lib/email-templates";
import { generateInvoicePDF } from "../lib/pdf-generator";

// Load .env from root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testEmails() {
    const testRecipient = "aamir.fss22@gmail.com"; // Change this if needed

    console.log(`Starting email tests to: ${testRecipient}...`);

    // 1. Test Welcome Email
    console.log("Sending Welcome Email...");
    const welcomeHtml = getWelcomeEmail("Aamir Hussain");
    const welcomeRes = await sendEmail({
        to: testRecipient,
        subject: "Welcome to Dear Bacchanal! (Test)",
        html: welcomeHtml
    });
    console.log("Welcome Result:", welcomeRes.success ? "SUCCESS" : "FAILED", welcomeRes.error || "");

    // 2. Test Order Confirmation Email (with placeholder "invoice" attachment)
    console.log("Sending Order Confirmation Email...");
    const orderHtml = getOrderConfirmationEmail({
        orderId: "ORD-TEST-12345",
        amount: 35.00,
        type: "hard",
        bookTitle: "My Caribbean Journey",
        transactionId: "pi_test_payment_id"
    });

    // Generate real PDF invoice
    const pdfBuffer = await generateInvoicePDF({
        orderId: "ORD-TEST-12345",
        date: new Date(),
        customerName: "Test User",
        customerEmail: testRecipient,
        amount: 35.00,
        type: "hard",
        bookTitle: "My Caribbean Journey"
    });

    const orderRes = await sendEmail({
        to: testRecipient,
        subject: "Order Confirmation (Test with PDF)",
        html: orderHtml,
        attachments: [
            {
                filename: "invoice.pdf",
                content: pdfBuffer,
                contentType: "application/pdf"
            }
        ]
    });
    console.log("Order Result:", orderRes.success ? "SUCCESS" : "FAILED", orderRes.error || "");

    console.log("Email tests complete.");
}

testEmails().catch(err => {
    console.error("Test execution failed:", err);
});
