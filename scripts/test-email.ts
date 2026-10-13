import dotenv from "dotenv";
import path from "path";
import { sendEmail } from "../lib/mail-service";
import {
  getOrderConfirmationEmail,
  getHardCopyOrderReceivedEmail,
  getHardCopyApprovalEmail,
} from "../lib/email-templates";
import { generateInvoicePDF } from "../lib/pdf-generator";

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testEmailWorkflows() {
  const recipient = "ahmedmahesar12@gmail.com";
  console.log("==================================================");
  console.log("TESTING ALL DEAR BACCHANAL EMAIL WORKFLOWS");
  console.log(`Sender:    ${process.env.EMAIL_USER}`);
  console.log(`Recipient: ${recipient}`);
  console.log("==================================================\n");

  const orderNumber = "#DB-78491";
  const bookTitle = "Trinidad & Tobago Carnival Memoir";
  const customerName = "Ahmed Mahesar";
  const orderDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // ─────────────────────────────────────────────────────────────
  // WORKFLOW 1: Soft Copy Purchase (Confirmation + PDF Invoice)
  // ─────────────────────────────────────────────────────────────
  console.log("▶ [1/3] Testing Soft Copy Purchase Workflow...");
  const softPdfBuffer = await generateInvoicePDF({
    orderId: "cs_test_soft_9812",
    date: new Date(),
    customerName,
    customerEmail: recipient,
    amount: 40.0,
    type: "soft",
    bookTitle,
  });

  const softHtml = getOrderConfirmationEmail({
    orderId: "cs_test_soft_9812",
    amount: 40.0,
    type: "soft",
    bookTitle,
    transactionId: "pi_test_3N28F109A",
    customerName,
    customerEmail: recipient,
  });

  const softRes = await sendEmail({
    to: recipient,
    subject: `Your Dear Bacchanal Order Confirmation - ${orderNumber}`,
    html: softHtml,
    attachments: [
      {
        filename: `Invoice-${orderNumber.replace("#", "")}.pdf`,
        content: softPdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
  console.log(
    softRes.success ? "✓ Workflow 1 Sent Successfully!" : "✗ Workflow 1 Failed:",
    softRes.error || ""
  );

  // ─────────────────────────────────────────────────────────────
  // WORKFLOW 2: Hard Copy Initial Purchase (In Queue / Pending Approval)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [2/3] Testing Hard Copy Purchase Initial (Queue / Pending Approval)...");
  const hardReceivedHtml = getHardCopyOrderReceivedEmail({
    customerName,
    orderNumber,
    bookTemplateName: bookTitle,
    orderDate,
  });

  const hardReceivedRes = await sendEmail({
    to: recipient,
    subject: `Hard Copy Order Received - ${orderNumber}`,
    html: hardReceivedHtml,
  });
  console.log(
    hardReceivedRes.success
      ? "✓ Workflow 2 Sent Successfully!"
      : "✗ Workflow 2 Failed:",
    hardReceivedRes.error || ""
  );

  // ─────────────────────────────────────────────────────────────
  // WORKFLOW 3: Hard Copy Admin Approved (Proceed to Print + PDF Invoice)
  // ─────────────────────────────────────────────────────────────
  console.log("\n▶ [3/3] Testing Hard Copy Admin Approval (Print Proceed + Invoice)...");
  const hardPdfBuffer = await generateInvoicePDF({
    orderId: "cs_test_hard_6631",
    date: new Date(),
    customerName,
    customerEmail: recipient,
    amount: 50.0,
    type: "hard",
    bookTitle,
  });

  const hardApprovalHtml = getHardCopyApprovalEmail({
    customerName,
    orderNumber,
    bookTemplateName: bookTitle,
    orderDate,
  });

  const hardApprovalRes = await sendEmail({
    to: recipient,
    subject: `Your Hard Copy Order Has Been Approved - ${orderNumber}`,
    html: hardApprovalHtml,
    attachments: [
      {
        filename: `Invoice-${orderNumber.replace("#", "")}.pdf`,
        content: hardPdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
  console.log(
    hardApprovalRes.success
      ? "✓ Workflow 3 Sent Successfully!"
      : "✗ Workflow 3 Failed:",
    hardApprovalRes.error || ""
  );

  console.log("\n==================================================");
  console.log("All 3 workflows executed using .env credentials!");
  console.log("==================================================");
}

testEmailWorkflows().catch((err) => {
  console.error("Workflow test failed:", err);
});
