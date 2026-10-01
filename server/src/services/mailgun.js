import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { config } from '../config/index.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({ username: 'api', key: config.mailgun.apiKey });

/**
 * Send an email using Mailgun
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 */
export async function sendEmail(to, subject, text, html = null) {
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
 * Send order confirmation email
 * @param {string} to - Customer email
 * @param {object} order - Order details
 * @param {Array} items - Order items
 */
export async function sendOrderConfirmation(to, order, items) {
  const itemsList = items
    .map((item) => `• ${item.name} x${item.quantity} — ₦${(item.price * item.quantity).toFixed(2)}`)
    .join('\n');

  const subject = `Order Confirmation #${order.id}`;
  const text = `Hi ${order.customer_name},

Thank you for your order! Here are your order details:

Order ID: ${order.id}
Date: ${new Date(order.created_at).toLocaleDateString()}

Items:
${itemsList}

Total: ₦${order.total_amount.toFixed(2)}

We'll notify you when your order ships.

Thanks for shopping with us!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Order Confirmation</h2>
      <p>Hi <strong>${order.customer_name}</strong>,</p>
      <p>Thank you for your order! Here are your order details:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order ID</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${order.id}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>Date</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${new Date(order.created_at).toLocaleDateString()}</td>
        </tr>
      </table>
      <h3>Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background: #f5f5f5;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Item</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Qty</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: right;">Price</th>
        </tr>
        ${items
          .map(
            (item) => `
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd;">${item.name}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: right;">₦${(item.price * item.quantity).toFixed(2)}</td>
          </tr>`
          )
          .join('')}
      </table>
      <p style="font-size: 18px; font-weight: bold; margin-top: 20px;">
        Total: ₦${order.total_amount.toFixed(2)}
      </p>
      <p>We'll notify you when your order ships.</p>
      <p>Thanks for shopping with us!</p>
    </div>
  `;

  return sendEmail(to, subject, text, html);
}
