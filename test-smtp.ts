import nodemailer from 'nodemailer';
import { config } from 'dotenv';
config({ path: '.env' });
config({ path: '.env.local' });

async function run() {
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_PORT:", process.env.SMTP_PORT);
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  // hide pass
  console.log("EMAIL_PASS length:", process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: true,
    debug: true
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Dear Bacchanal" <${process.env.EMAIL_USER}>`,
      to: "abdulrafiumahesar@gmail.com", // Send to user
      subject: "Test Email from Dear Bacchanal System",
      html: `
        <h2>System Test</h2>
        <p>This is an automated test email from your Dear Bacchanal application to verify SMTP settings.</p>
        <p>If you are reading this, your email configuration is working successfully.</p>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `,
    });
    console.log("Message sent: %s", info.messageId);
  } catch(e) {
    console.error("Error sending:", e);
  }
}
run();
