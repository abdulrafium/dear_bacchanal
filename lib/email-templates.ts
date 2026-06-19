export const getBaseEmailTemplate = (content: string, previewText?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dear Bacchanal</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Poppins:wght@300;400;500;600;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #d92e20;
      font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #d92e20;
      padding: 40px 15px;
    }

    .main {
      background-color: #000000;
      margin: 0 auto;
      width: 100%;
      max-width: 600px;
      border-spacing: 0;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
    }

    .header {
      padding: 60px 0;
      text-align: center;
      background: radial-gradient(circle, #d92e20 0%, #000000 100%);
      border-bottom: 4px solid #ffce1a;
    }

    .logo-container {
        font-family: 'Luckiest Guy', cursive;
        font-size: 44px;
        color: #ffce1a;
        letter-spacing: 2px;
        text-shadow: 3px 3px 0px #000000;
    }

    .content {
      padding: 50px 40px;
      color: #ffffff;
      font-size: 16px;
      line-height: 1.8;
    }

    .title {
      font-family: 'Luckiest Guy', cursive;
      color: #ffce1a;
      font-size: 34px;
      margin-bottom: 24px;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .button-container {
      text-align: left;
      padding: 30px 0;
    }

    .button {
      background: #ffce1a;
      color: #000000 !important;
      padding: 18px 36px;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 900;
      font-size: 16px;
      display: inline-block;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .footer {
      padding: 40px;
      text-align: center;
      color: #888888;
      font-size: 12px;
      background-color: #0c0c0c;
    }

    .order-summary {
      background-color: #111111;
      border-radius: 16px;
      padding: 24px;
      margin: 24px 0;
      border: 1px solid #333333;
    }

    .order-item {
      display: table;
      width: 100%;
      margin-bottom: 12px;
    }

    .order-label {
        display: table-cell;
        text-align: left;
        color: #888888;
        font-size: 14px;
    }

    .order-value {
        display: table-cell;
        text-align: right;
        color: #ffffff;
        font-weight: 700;
    }

    .order-total {
        border-top: 1px solid #333333;
        padding-top: 16px;
        margin-top: 16px;
        font-weight: 900;
        font-size: 26px;
        color: #ffce1a;
    }

    .info-card {
        border-left: 6px solid #288a7c;
        background: #111e1d;
        padding: 24px;
        margin: 24px 0;
        border-radius: 12px;
        color: #ffffff;
    }
  </style>
</head>
<body>
  ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>` : ''}
  <div class="wrapper">
    <table class="main">
      <tr>
        <td class="header">
          <div class="logo-container">
            DEAR BACCHANAL
          </div>
        </td>
      </tr>
      <tr>
        <td class="content">
          ${content}
        </td>
      </tr>
      <tr>
        <td class="footer">
          <p style="font-weight: 900; color: #d92e20; font-size: 16px; margin-top: 0;">DEAR BACCHANAL</p>
          <p>© ${new Date().getFullYear()} All rights reserved. Your ultimate carnival heritage portal.</p>
          <p style="margin-top: 24px;">
            <a href="https://dearbacchanal.com" style="color: #ffce1a; text-decoration: none; font-weight: 800;">Visit Website</a>
          </p>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

export const getWelcomeEmail = (name: string) => {
  const content = `
    <h1 class="title">STEP INTO THE FETE, ${name}!</h1>
    <p>Welcome to <strong>Dear Bacchanal</strong>. We are thrilled to have you in our global carnival family. From here on, every memory you create is part of our shared heritage.</p>
    <div class="info-card">
        <strong style="color: #ffce1a;">THE CARNIVAL IS WAITING</strong><br/>
        Use our digital editor to start preserving your unique carnival story today.
    </div>
    <div class="button-container">
      <a href="https://dearbacchanal.com/dashboard" class="button">ENTER THE FESTIVAL</a>
    </div>
    <p>If you need any help, just hit reply. Our crew is always ready to jump in.</p>
  `;
  return getBaseEmailTemplate(content, "Welcome to the Celebration!");
};

export const getOrderConfirmationEmail = (orderData: {
  orderId: string;
  amount: number;
  type: string;
  bookTitle?: string;
  transactionId: string;
  customerName?: string;
  customerEmail?: string;
}) => {
  const content = `
    <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; font-family: 'Poppins', sans-serif; color: #111; margin-top: 20px;">
        <div style="background: linear-gradient(to right, #9f2e2b, #be2826, #ecb52b); height: 12px; width: 100%;"></div>
        <div style="padding: 40px;">
            <div style="text-align: right; margin-bottom: 30px;">
                <h2 style="font-size: 32px; font-weight: 900; color: #111; margin: 0; letter-spacing: -1px;">RECEIPT</h2>
                <p style="font-size: 14px; font-weight: 700; color: #be2826; margin: 5px 0 0 0;">#${orderData.orderId.slice(-8).toUpperCase()}</p>
                <p style="font-size: 10px; font-weight: 800; color: #888; margin: 0; text-transform: uppercase;">${new Date().toLocaleDateString()}</p>
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                    <td width="50%" valign="top">
                        <div style="font-size: 10px; font-weight: 900; color: #aaa; letter-spacing: 2px; margin-bottom: 10px; text-transform: uppercase;">
                            <span style="color: #be2826;">●</span> Billed To
                        </div>
                        <div style="font-size: 16px; font-weight: 900; color: #111;">${orderData.customerName || 'Customer'}</div>
                        <div style="font-size: 12px; font-weight: 700; color: #be2826;">${orderData.customerEmail || ''}</div>
                    </td>
                    <td width="50%" valign="top">
                        <div style="font-size: 10px; font-weight: 900; color: #aaa; letter-spacing: 2px; margin-bottom: 10px; text-transform: uppercase;">
                            <span style="color: #ecb52b;">●</span> From
                        </div>
                        <div style="font-size: 16px; font-weight: 900; color: #111;">Dear Bacchanal Ltd.</div>
                        <div style="font-size: 12px; font-weight: 700; color: #888;">billing@dearbacchanal.com</div>
                    </td>
                </tr>
            </table>
            
            <div style="background-color: #f9f9f9; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                        <td style="padding-bottom: 10px; border-bottom: 2px solid #eee; font-size: 10px; font-weight: 900; color: #aaa; text-transform: uppercase;">Description</td>
                        <td style="padding-bottom: 10px; border-bottom: 2px solid #eee; font-size: 10px; font-weight: 900; color: #aaa; text-transform: uppercase; text-align: right;">Total</td>
                    </tr>
                    <tr>
                        <td style="padding-top: 20px; padding-bottom: 20px;">
                            <div style="font-size: 16px; font-weight: 900; color: #111;">${orderData.bookTitle || 'Dear Bacchanal Edition'}</div>
                            <div style="font-size: 10px; font-weight: 800; color: #fff; background-color: #111; display: inline-block; padding: 2px 6px; border-radius: 4px; margin-top: 5px; text-transform: uppercase;">${orderData.type === 'hard' ? 'Hardcover' : 'Digital Edition'}</div>
                        </td>
                        <td style="padding-top: 20px; padding-bottom: 20px; font-size: 18px; font-weight: 900; color: #111; text-align: right;">
                            $${orderData.amount.toFixed(2)}
                        </td>
                    </tr>
                </table>
            </div>
            
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td width="50%" valign="bottom">
                        <div style="border: 2px dashed #eee; padding: 10px; border-radius: 8px; text-align: center; width: 120px;">
                            <div style="font-size: 10px; font-weight: 900; color: #288a7c; text-transform: uppercase;">PAYMENT VERIFIED</div>
                            <div style="font-size: 8px; font-weight: 700; color: #888; margin-top: 2px;">ID: ${(orderData.transactionId || '').slice(-8)}</div>
                        </div>
                    </td>
                    <td width="50%" valign="bottom" align="right">
                        <div style="font-size: 10px; font-weight: 900; color: #be2826; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">Grand Total</div>
                        <div style="font-size: 28px; font-weight: 900; color: #111;">$${orderData.amount.toFixed(2)}</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="button-container" style="text-align: center;">
      <a href="https://dearbacchanal.com/dashboard" class="button">VIEW IN DASHBOARD</a>
    </div>
  `;
  return getBaseEmailTemplate(content, `Receipt: #${orderData.orderId.slice(-8).toUpperCase()}`);
};

export const getOrderCompletedEmail = (orderId: string) => {
    const content = `
      <h1 class="title">CURTAIN RISES!</h1>
      <p>Congratulations! Your order <span class="highlight">#${orderId.slice(-8).toUpperCase()}</span> is now complete and finalized.</p>
      <div class="info-card">
        <strong>THE WAIT IS OVER</strong><br/>
        Check your dashboard now to download your digital heirloom or track your physical shipment.
      </div>
      <div class="button-container">
        <a href="https://dearbacchanal.com/dashboard" class="button">GO TO DASHBOARD</a>
      </div>
    `;
    return getBaseEmailTemplate(content, "Your Order is Ready!");
};

export const getRefundEmail = (orderId: string, amount: number) => {
    const content = `
      <h1 class="title">REFUND PROCESSED</h1>
      <p>We've successfully processed a reversal for order <span class="highlight">#${orderId.slice(-8).toUpperCase()}</span>.</p>
      <div class="info-card" style="border-left-color: #d92e20; background: #1a0808;">
        <strong>REVERSAL AMOUNT:</strong> $${amount.toFixed(2)}<br/>
        <strong>NOTE:</strong> It may take 5-10 days for your bank to reflect this.
      </div>
    `;
    return getBaseEmailTemplate(content, "Refund Confirmation");
};

export const getContactAdminNotification = (data: { name: string, email: string, subject: string, message: string }) => {
    const content = `
      <h1 class="title">NEW DISPATCH</h1>
      <div class="order-summary">
        <div class="order-item"><span class="order-label">FROM:</span><span class="order-value">${data.name}</span></div>
        <div class="order-item"><span class="order-label">EMAIL:</span><span class="order-value">${data.email}</span></div>
        <div class="order-item"><span class="order-label">TOPIC:</span><span class="order-value">${data.subject}</span></div>
      </div>
      <p><strong>INQUIRY DETAIL:</strong></p>
      <div style="background: #1a1a1a; padding: 25px; border-radius: 12px; color: #ffffff; border: 1px solid #333; font-style: italic;">
        "${data.message}"
      </div>
    `;
    return getBaseEmailTemplate(content, `Dispatch: ${data.subject}`);
};

export const getContactUserConfirmation = (name: string) => {
    const content = `
      <h1 class="title">SIGNAL RECEIVED!</h1>
      <p>Hey ${name}, thanks for reaching out. We've received your inquiry and our support crew will get back to you within 24 hours.</p>
      <div class="button-container">
        <a href="https://dearbacchanal.com" class="button">BACK TO THE FETE</a>
      </div>
    `;
    return getBaseEmailTemplate(content, "Message Received");
};

export const getForgotPasswordEmail = (resetLink: string) => {
    const content = `
      <h1 class="title">LOST YOUR KEY?</h1>
      <p>No worries! Happens to the best of us during a fete. Click the button below to reset your password.</p>
      <div class="button-container">
        <a href="${resetLink}" class="button">SET NEW PASSWORD</a>
      </div>
      <p style="font-size: 11px; color: #555;">Link valid for 60 minutes. If this wasn't you, just delete this email.</p>
    `;
    return getBaseEmailTemplate(content, "Password Reset Request");
};

// ─────────────────────────────────────────────────────────────────────────────
// HARD COPY WORKFLOW EMAILS
// ─────────────────────────────────────────────────────────────────────────────

export const getHardCopyOrderReceivedEmail = (data: {
  customerName: string;
  orderNumber: string;
  bookTemplateName: string;
  orderDate: string;
}) => {
  const content = `
    <h1 class="title">ORDER RECEIVED!</h1>
    <p>Hello ${data.customerName},</p>
    <p>Thank you for your order.</p>
    <p>Your hard copy book order has been successfully placed and is currently <strong style="color:#ffce1a;">pending admin approval</strong>.</p>

    <div class="order-summary">
      <div class="order-item">
        <span class="order-label">Order Number:</span>
        <span class="order-value">${data.orderNumber}</span>
      </div>
      <div class="order-item">
        <span class="order-label">Book Name:</span>
        <span class="order-value">${data.bookTemplateName}</span>
      </div>
      <div class="order-item">
        <span class="order-label">Order Date:</span>
        <span class="order-value">${data.orderDate}</span>
      </div>
    </div>

    <div class="info-card">
      <strong style="color:#ffce1a;">WHAT HAPPENS NEXT?</strong><br/>
      You will receive another email once the order has been approved and forwarded for printing.
    </div>

    <p>Thank you.</p>
  `;
  return getBaseEmailTemplate(content, "Hard Copy Order Received");
};

export const getHardCopyApprovalEmail = (data: {
  customerName: string;
  orderNumber: string;
  bookTemplateName: string;
  orderDate: string;
}) => {
  const content = `
    <h1 class="title">ORDER APPROVED!</h1>
    <p>Hello ${data.customerName},</p>
    <p>Your hard copy book order has been <strong style="color:#ffce1a;">approved</strong> by our team and has been forwarded to <strong>PurePrint</strong> for printing.</p>

    <div class="order-summary">
      <div class="order-item">
        <span class="order-label">Order Number:</span>
        <span class="order-value">${data.orderNumber}</span>
      </div>
      <div class="order-item">
        <span class="order-label">Book Name:</span>
        <span class="order-value">${data.bookTemplateName}</span>
      </div>
      <div class="order-item">
        <span class="order-label">Order Date:</span>
        <span class="order-value">${data.orderDate}</span>
      </div>
    </div>

    <div class="info-card">
      <strong style="color:#ffce1a;">INVOICE ATTACHED</strong><br/>
      Please find your invoice attached to this email. Keep it for your records.
    </div>

    <p>Thank you for your order!</p>
  `;
  return getBaseEmailTemplate(content, "Your Hard Copy Order Has Been Approved");
};
