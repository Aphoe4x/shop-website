import formData from 'form-data';
import Mailgun from 'mailgun.js';
import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: config.mailgun.apiKey });

// Gmail SMTP transport (used when EMAIL_PROVIDER=gmail)
let gmailTransport = null;
function getGmailTransport() {
  if (!gmailTransport) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD are required for Gmail SMTP');
    }
    gmailTransport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return gmailTransport;
}

const BRAND = 'Shopping';
const SITE_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/** Escape user-provided values before embedding in HTML. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const naira = (amount) => `&#8358;${Number(amount).toFixed(2)}`;

/**
 * Send an email using the configured provider.
 * Set EMAIL_PROVIDER=gmail to use Gmail SMTP (sends to anyone).
 * Otherwise falls back to Mailgun.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 */
export async function sendEmail(to, subject, text, html = null) {
  if (config.emailProvider === 'gmail') {
    return sendViaGmail(to, subject, text, html);
  }
  return sendViaMailgun(to, subject, text, html);
}

async function sendViaGmail(to, subject, text, html) {
  try {
    const transport = getGmailTransport();
    const info = await transport.sendMail({
      from: config.gmail.user,
      to,
      subject,
      text,
      ...(html ? { html } : {}),
    });
    console.log(`Email (Gmail) sent to ${to}:`, info.messageId);
    return info;
  } catch (error) {
    console.error('Gmail SMTP error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

async function sendViaMailgun(to, subject, text, html) {
  const data = {
    from: config.mailgun.fromEmail,
    to,
    subject,
    text,
  };

  if (html) {
    data.html = html;
  }

  try {
    const response = await mg.messages.create(config.mailgun.domain, data);
    console.log(`Email sent to ${to}:`, response.id);
    return response;
  } catch (error) {
    console.error('Mailgun error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Build the order confirmation email content.
 * @returns {{ subject: string, text: string, html: string }}
 */
export function buildOrderConfirmation(order, items) {
  const shortId = String(order.id).split('-')[0].toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const itemsList = items
    .map((item) => `• ${item.name} x${item.quantity} — ₦${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const subject = `Order Confirmation #${shortId} — ${BRAND}`;

  const text = `Hi ${order.customer_name},

Thank you for your order! Here are your order details:

Order ID: #${shortId}
Date: ${orderDate}

Items:
${itemsList}

Total: ₦${Number(order.total_amount).toFixed(2)}

We'll notify you when your order ships.

Thanks for shopping with us!
— ${BRAND} (${SITE_URL})`;

  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 10px; border-bottom: 1px solid #eee; color: #222;">
            ${escapeHtml(item.name)}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: center; color: #222;">
            ${Number(item.quantity)}
          </td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #eee; text-align: right; color: #222; white-space: nowrap;">
            ${naira(item.price * item.quantity)}
          </td>
        </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
            <!-- Header -->
            <tr>
              <td style="background:#1a1a2e; padding: 28px 32px;">
                <span style="color:#ffffff; font-size:22px; font-weight:bold; letter-spacing:-0.5px;">${BRAND}</span>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding: 32px;">
                <h1 style="margin:0 0 8px; font-size:22px; color:#1a1a2e;">Order Confirmed 🎉</h1>
                <p style="margin:0 0 24px; color:#555; font-size:15px;">
                  Hi <strong>${escapeHtml(order.customer_name)}</strong>, thank you for your order. We're getting it ready for you.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa; border-radius:8px; margin-bottom:24px;">
                  <tr>
                    <td style="padding:14px 16px; color:#555; font-size:14px;">Order ID</td>
                    <td style="padding:14px 16px; color:#1a1a2e; font-size:14px; text-align:right; font-weight:bold;">#${shortId}</td>
                  </tr>
                  <tr>
                    <td style="padding:14px 16px; color:#555; font-size:14px; border-top:1px solid #eee;">Date</td>
                    <td style="padding:14px 16px; color:#1a1a2e; font-size:14px; text-align:right; border-top:1px solid #eee;">${orderDate}</td>
                  </tr>
                </table>

                <h2 style="margin:0 0 12px; font-size:16px; color:#1a1a2e;">Order Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <thead>
                    <tr>
                      <th align="left" style="padding:10px; border-bottom:2px solid #1a1a2e; color:#555; font-size:13px; text-transform:uppercase;">Item</th>
                      <th align="center" style="padding:10px; border-bottom:2px solid #1a1a2e; color:#555; font-size:13px; text-transform:uppercase;">Qty</th>
                      <th align="right" style="padding:10px; border-bottom:2px solid #1a1a2e; color:#555; font-size:13px; text-transform:uppercase;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="2" align="right" style="padding:16px 10px; font-size:16px; font-weight:bold; color:#1a1a2e;">Total</td>
                      <td align="right" style="padding:16px 10px; font-size:16px; font-weight:bold; color:#1a1a2e; white-space:nowrap;">${naira(order.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>

                <p style="margin:24px 0 0; color:#555; font-size:14px;">
                  We'll notify you when your order ships. If you have any questions, just reply to this email.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:#f8f9fa; padding:20px 32px; text-align:center; color:#888; font-size:12px;">
                ${BRAND} &middot; Lagos, Nigeria<br />
                <a href="${SITE_URL}" style="color:#1a1a2e; text-decoration:none;">${SITE_URL}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

/**
 * Send order confirmation email
 * @param {string} to - Customer email
 * @param {object} order - Order details
 * @param {Array} items - Order items
 */
export async function sendOrderConfirmation(to, order, items) {
  const { subject, text, html } = buildOrderConfirmation(order, items);
  return sendEmail(to, subject, text, html);
}