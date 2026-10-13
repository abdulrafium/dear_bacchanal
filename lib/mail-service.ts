import nodemailer from "nodemailer";

let currentConfigKey = "";
let transporter: any;

const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = parseInt(process.env.SMTP_PORT || "465");
  const user = process.env.EMAIL_USER || "";
  const pass = process.env.EMAIL_PASS || "";
  const configKey = `${host}:${port}:${user}:${pass}`;

  if (!transporter || currentConfigKey !== configKey) {
    currentConfigKey = configKey;
    const isGmail = host.includes("gmail") || user.endsWith("@gmail.com");

    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: user,
          pass: pass.replace(/\s+/g, ""),
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port === 465,
        auth: {
          user: user,
          pass: pass,
        },
      });
    }
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
