import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resendApiKey = process.env.RESEND_API_KEY;
export const resend = new Resend(resendApiKey || 'dummy_key');

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Menyphis <onboarding@resend.dev>';
export const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || 'hasaanf987@gmail.com';
const SITE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Format currency for emails
 */
function formatCurrency(amount) {
  return `Rs ${Number(amount || 0).toLocaleString()}`;
}

/**
 * Send an Order Confirmation Email to the customer
 */
export async function sendOrderConfirmationEmail({
  orderId,
  customerEmail,
  customerName = 'Valued Customer',
  total,
  discountAmount = 0,
  shippingCost = 0,
  shippingAddress = '',
  items = [],
}) {
  if (!customerEmail) {
    console.warn('[Email] Skipping order confirmation: No customer email provided');
    return { success: false, error: 'No recipient email' };
  }

  const trackingUrl = `${SITE_URL}/track?code=${orderId}`;
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

  const itemsHtml = items.map((item) => {
    const itemImg = item.image || item.product_image || item.image_url || '';
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <!-- Product Thumbnail -->
        <td style="width: 56px; padding: 14px 12px 14px 0; vertical-align: middle;">
          ${itemImg ? `
            <img 
              src="${itemImg}" 
              alt="${item.name || 'Piece'}" 
              width="54" 
              height="54" 
              style="width: 54px; height: 54px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block; background-color: #f8fafc;"
            />
          ` : `
            <div style="width: 54px; height: 54px; border-radius: 8px; background: #f1f5f9; border: 1px solid #e2e8f0; text-align: center; line-height: 54px; color: #64748b; font-size: 11px; font-weight: 800; font-family: monospace;">
              MNY
            </div>
          `}
        </td>
        <td style="padding: 14px 8px 14px 0; vertical-align: middle;">
          <div style="font-weight: 800; color: #0f172a; font-size: 14px; letter-spacing: -0.01em; margin-bottom: 5px; text-transform: uppercase;">
            ${item.name || item.title || 'Streetwear Apparel'}
          </div>
          <div style="font-size: 11px; color: #64748b; display: flex; gap: 6px; flex-wrap: wrap;">
            ${item.size ? `<span style="background: #f1f5f9; padding: 2px 7px; border-radius: 4px; color: #334155; font-weight: 600;">SIZE: ${item.size}</span>` : ''} 
            ${item.color ? `<span style="background: #f1f5f9; padding: 2px 7px; border-radius: 4px; color: #334155; font-weight: 600;">COLOR: ${item.color}</span>` : ''}
            ${item.store_name ? `<span style="background: #ede9fe; color: #6d28d9; padding: 2px 7px; border-radius: 4px; font-weight: 700;">STORE: ${item.store_name.toUpperCase()}</span>` : ''}
          </div>
        </td>
        <td style="padding: 14px 10px; text-align: center; color: #334155; font-size: 13px; font-weight: 700; vertical-align: middle;">
          <span style="background: #f8fafc; padding: 4px 9px; border-radius: 6px; border: 1px solid #e2e8f0; font-family: monospace;">
            ×${item.quantity}
          </span>
        </td>
        <td style="padding: 14px 0 14px 10px; text-align: right; font-weight: 800; color: #0f172a; font-size: 14px; vertical-align: middle; font-family: monospace;">
          ${formatCurrency(Number(item.price) * Number(item.quantity))}
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation #${orderId} • Menyphis</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 36px 12px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.06);">
                
                <!-- Store Top Announcement Bar (matching website header) -->
                <tr>
                  <td style="background: #000000; color: #ffffff; text-align: center; padding: 10px 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em;">
                    ⚡ FREE SHIPPING on orders over Rs 99 — Use code <span style="color: #FFD700; font-weight: 800;">MENYPHIS20</span> for 20% OFF
                  </td>
                </tr>

                <!-- Purple Accent Strip -->
                <tr>
                  <td style="height: 3px; background: linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #6366f1 100%);"></td>
                </tr>

                <!-- Brand Header Bar -->
                <tr>
                  <td style="padding: 32px 38px 22px 38px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="left">
                          <div style="font-size: 26px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase; color: #0f172a; line-height: 1;">
                            MENYPHIS
                          </div>
                          <div style="font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #8b5cf6; font-weight: 800; margin-top: 5px;">
                            Streetwear Archive // Acquisition Receipt
                          </div>
                        </td>
                        <td align="right">
                          <div style="display: inline-block; padding: 5px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 999px; font-size: 10px; font-weight: 800; color: #059669; letter-spacing: 0.08em; text-transform: uppercase;">
                            ● Vault Secured
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Hero Status Section -->
                <tr>
                  <td style="padding: 32px 38px 18px 38px;">
                    <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: #8b5cf6; text-transform: uppercase; margin-bottom: 8px;">
                      ACQUISITION CONFIRMED
                    </div>
                    <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0 0 10px 0; letter-spacing: -0.02em; line-height: 1.2;">
                      You&apos;re Locked In, ${customerName}.
                    </h1>
                    <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0;">
                      Your order has been officially verified and routed to our fulfillment vault. Limited-run pieces are prepped with authenticity seals for rapid dispatch.
                    </p>
                  </td>
                </tr>

                <!-- Order Intel Box -->
                <tr>
                  <td style="padding: 0 38px 24px 38px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px 20px;">
                      <tr>
                        <td style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; padding-bottom: 4px;">Tracking ID</td>
                        <td style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; text-align: center; padding-bottom: 4px;">Issue Date</td>
                        <td style="color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.1em; text-align: right; padding-bottom: 4px;">Protocol</td>
                      </tr>
                      <tr>
                        <td style="font-size: 15px; font-weight: 900; color: #7c3aed; font-family: monospace;">#${orderId}</td>
                        <td style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: center;">${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td style="font-size: 12px; font-weight: 800; color: #059669; text-align: right;">PRIORITY</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Line Items Table -->
                <tr>
                  <td style="padding: 0 38px 24px 38px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; margin-bottom: 12px;">
                      MANIFEST ITEMS (${items.length})
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                      <thead>
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                          <th colspan="2" style="padding: 8px 0; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;">Piece</th>
                          <th style="padding: 8px 10px; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;">Qty</th>
                          <th style="padding: 8px 0; text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8;">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- Price Ledger Breakdown -->
                <tr>
                  <td style="padding: 0 38px 26px 38px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 18px 20px;">
                      <tr>
                        <td style="padding: 5px 0; color: #64748b; font-size: 13px;">Subtotal</td>
                        <td style="padding: 5px 0; color: #0f172a; font-size: 13px; text-align: right; font-weight: 700; font-family: monospace;">${formatCurrency(subtotal)}</td>
                      </tr>
                      ${discountAmount > 0 ? `
                        <tr>
                          <td style="padding: 5px 0; color: #059669; font-size: 13px; font-weight: 700;">VIP Voucher Discount</td>
                          <td style="padding: 5px 0; color: #059669; font-size: 13px; text-align: right; font-weight: 800; font-family: monospace;">-${formatCurrency(discountAmount)}</td>
                        </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 5px 0; color: #64748b; font-size: 13px;">Express Shipping</td>
                        <td style="padding: 5px 0; text-align: right; font-weight: 700; font-size: 13px; font-family: monospace;">
                          ${shippingCost === 0 ? '<span style="color: #059669; font-weight: 800;">FREE EXPRESS</span>' : `<span style="color: #0f172a;">${formatCurrency(shippingCost)}</span>`}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 0 0 0; color: #0f172a; font-size: 15px; font-weight: 900; letter-spacing: -0.01em; text-transform: uppercase; border-top: 1px solid #e2e8f0;">Grand Total</td>
                        <td style="padding: 14px 0 0 0; color: #0f172a; font-size: 22px; font-weight: 900; text-align: right; border-top: 1px solid #e2e8f0; font-family: monospace;">
                          ${formatCurrency(total)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Destination Coordinates / Shipping Address -->
                ${shippingAddress ? `
                  <tr>
                    <td style="padding: 0 38px 24px 38px;">
                      <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px 20px;">
                        <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #8b5cf6; margin-bottom: 6px;">
                          📍 DELIVERY COORDINATES
                        </div>
                        <div style="font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap; font-family: monospace;">
                          ${shippingAddress}
                        </div>
                      </div>
                    </td>
                  </tr>
                ` : ''}

                <!-- Track Button Action -->
                <tr>
                  <td style="padding: 0 38px 28px 38px; text-align: center;">
                    <a 
                      href="${trackingUrl}" 
                      style="display: inline-block; width: 85%; max-width: 420px; background-color: #000000; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 8px 20px rgba(0,0,0,0.15);"
                    >
                      Track Shipment in Real Time →
                    </a>
                  </td>
                </tr>

                <!-- VIP Next Drop Reward Box -->
                <tr>
                  <td style="padding: 0 38px 30px 38px;">
                    <div style="background-color: #fffbeb; border: 1px dashed #fcd34d; border-radius: 12px; padding: 14px 18px;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td>
                            <div style="font-size: 10px; font-weight: 800; color: #b45309; letter-spacing: 0.12em; text-transform: uppercase;">
                              ★ NEXT DROP REWARD
                            </div>
                            <div style="font-size: 12px; color: #78350f; margin-top: 3px;">
                              Claim <strong style="color: #b45309;">20% OFF</strong> your next drop with code <span style="font-family: monospace; font-weight: 900; color: #000000; background: #fef3c7; padding: 2px 7px; border-radius: 4px; border: 1px solid #fde68a;">MENYPHIS20</span>
                            </div>
                          </td>
                          <td align="right" style="vertical-align: middle;">
                            <a href="${SITE_URL}/shop" style="display: inline-block; padding: 7px 14px; background: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">
                              SHOP DROPS →
                            </a>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- Streetwear Barcode & Seal -->
                <tr>
                  <td style="padding: 22px 38px 28px 38px; text-align: center; border-top: 1px solid #f1f5f9; background-color: #f8fafc;">
                    <div style="font-family: monospace; font-size: 16px; letter-spacing: 5px; color: #94a3b8; margin-bottom: 6px;">
                      ||| | ||||| || |||| ||| ||||| | || |||||
                    </div>
                    <div style="font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: #64748b; font-weight: 700;">
                      PARIS • TOKYO • NEW YORK
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
                      © 2026 Menyphis Streetwear Marketplace. Verified Authentic Archive.
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const isSandbox = DEFAULT_FROM.includes('resend.dev');
    const recipient = isSandbox ? ADMIN_EMAIL : customerEmail;

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [recipient],
      subject: `Order Confirmed: #${orderId} • Menyphis`,
      html: htmlContent,
    });

    if (error) {
      console.error('[Resend Error] Order confirmation failed:', error);
      return { success: false, error };
    }

    console.log(`[Resend Success] Order confirmation sent to ${customerEmail} (ID: ${data?.id})`);
    return { success: true, data };
  } catch (err) {
    console.error('[Resend Exception] Order confirmation email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send an Order Notification Email to the vendor / store owner
 */
export async function sendVendorOrderNotification({
  vendorEmail,
  storeName,
  orderId,
  items = [],
  storeTotal = 0,
}) {
  if (!vendorEmail) return { success: false, error: 'No vendor email' };

  const vendorPortalUrl = `${SITE_URL}/admin/orders`;

  const itemsHtml = items.map((i) => {
    const itemImg = i.image || i.product_image || i.image_url || '';
    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="width: 48px; padding: 12px 10px 12px 0; vertical-align: middle;">
          ${itemImg ? `
            <img 
              src="${itemImg}" 
              alt="${i.name || 'Piece'}" 
              width="44" 
              height="44" 
              style="width: 44px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; display: block; background: #f8fafc;"
            />
          ` : `
            <div style="width: 44px; height: 44px; border-radius: 6px; background: #f1f5f9; text-align: center; line-height: 44px; color: #64748b; font-size: 10px; font-weight: 800; font-family: monospace;">
              ST
            </div>
          `}
        </td>
        <td style="padding: 12px 8px 12px 0; color: #0f172a; font-weight: 700; font-size: 13px; vertical-align: middle;">
          ${i.name || 'Streetwear Piece'}
          ${i.size || i.color ? `<div style="font-size: 11px; color: #64748b; font-weight: normal; margin-top: 3px;">Size: ${i.size || 'Standard'} ${i.color ? `• Color: ${i.color}` : ''}</div>` : ''}
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #334155; font-weight: 700; font-size: 13px; vertical-align: middle;">
          <span style="background: #f8fafc; padding: 3px 8px; border-radius: 5px; border: 1px solid #e2e8f0; font-family: monospace;">×${i.quantity}</span>
        </td>
        <td style="padding: 12px 0; text-align: right; color: #0f172a; font-weight: 800; font-size: 13px; font-family: monospace; vertical-align: middle;">
          ${formatCurrency(Number(i.price) * Number(i.quantity))}
        </td>
      </tr>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>New Order #${orderId} • ${storeName}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 36px 12px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.06);">
                
                <tr>
                  <td style="height: 3px; background: linear-gradient(90deg, #0284c7 0%, #6366f1 100%);"></td>
                </tr>

                <tr>
                  <td style="padding: 32px 36px 20px; border-bottom: 1px solid #f1f5f9;">
                    <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; color: #0284c7; margin-bottom: 6px;">
                      VENDOR DISPATCH TELEMETRY
                    </div>
                    <div style="font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">
                      New Sale for ${storeName}
                    </div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">
                      Order #${orderId} has been placed containing inventory from your brand catalog.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 24px 36px;">
                    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 18px 22px; margin-bottom: 24px;">
                      <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #047857; letter-spacing: 0.1em;">Store Net Subtotal</div>
                      <div style="font-size: 26px; font-weight: 900; color: #059669; font-family: monospace; margin-top: 4px;">
                        ${formatCurrency(storeTotal)}
                      </div>
                    </div>

                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; margin-bottom: 12px;">
                      Ordered Store Inventory
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 28px;">
                      ${itemsHtml}
                    </table>

                    <div style="text-align: center;">
                      <a 
                        href="${vendorPortalUrl}" 
                        style="display: inline-block; width: 85%; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 28px; border-radius: 10px; font-size: 13px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; box-shadow: 0 4px 14px rgba(0,0,0,0.12);"
                      >
                        Fulfill in Vendor Portal →
                      </a>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 20px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 11px;">
                    © 2026 Menyphis Multi-Vendor Platform. Automated Dispatch Telemetry.
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const isSandbox = DEFAULT_FROM.includes('resend.dev');
    const recipient = isSandbox ? ADMIN_EMAIL : vendorEmail;

    return await resend.emails.send({
      from: DEFAULT_FROM,
      to: [recipient],
      subject: `New Store Order #${orderId} • ${storeName}`,
      html: htmlContent,
    });
  } catch (err) {
    console.error('[Resend Exception] Vendor notification email:', err);
    return { success: false, error: err.message };
  }
}
