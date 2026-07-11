import nodemailer from "nodemailer";

let transporter: any;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: parseInt(process.env.SMTP_PORT || "465"),
      secure: true, 
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
};

interface Attachment {
    filename: string;
    content: any;
    contentType?: string;
}

interface EmailOptions {
  from?: string;
  to: string;
  subject: string;
  html: string;
  attachments?: Attachment[];
}

export const sendEmail = async ({ from, to, subject, html, attachments }: EmailOptions) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Email credentials missing in .env");
    return { success: false, error: "Credentials missing" };
  }

  try {
    const info = await getTransporter().sendMail({
      from: from || process.env.EMAIL_FROM || `"Dear Bacchanal" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
    });
    console.log("Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
};
