import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'order';

  const formatCurrency = (val) => `Rs ${Number(val || 0).toLocaleString()}`;
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (type === 'vip') {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Menyphis VIP Pass Preview</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 36px 12px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.06);">
                  
                  <!-- Purple Accent Strip -->
                  <tr>
                    <td style="height: 3px; background: linear-gradient(90deg, #6366f1 0%, #ec4899 50%, #8b5cf6 100%);"></td>
                  </tr>

                  <!-- Brand Header -->
                  <tr>
                    <td style="padding: 32px 38px 22px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="left">
                            <div style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #0f172a;">
                              MENYPHIS
                            </div>
                            <div style="font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #ec4899; font-weight: 800; margin-top: 4px;">
                              VIP Drop Access Pass // Priority Tier
                            </div>
                          </td>
                          <td align="right">
                            <div style="display: inline-block; padding: 5px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 999px; font-size: 10px; font-weight: 800; color: #059669; letter-spacing: 0.08em; text-transform: uppercase;">
                              ● Pass Active
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Body Content -->
                  <tr>
                    <td style="padding: 32px 38px 24px;">
                      <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: #7c3aed; text-transform: uppercase; margin-bottom: 8px;">
                        WELCOME TO THE INNER CIRCLE
                      </div>
                      <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.02em; line-height: 1.2;">
                        You're on the Inside.
                      </h1>
                      <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
                        Your email (hasaanf987@gmail.com) has been provisioned with priority access. When limited-quantity collections and vault archives drop, you will receive notifications 15 minutes before public launch.
                      </p>

                      <!-- VIP Pass Ticket Box -->
                      <div style="background-color: #fffbeb; border: 1px dashed #fcd34d; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="vertical-align: top;">
                              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #b45309; letter-spacing: 0.12em; margin-bottom: 4px;">
                                ★ EXCLUSIVE INSIDER CODE
                              </div>
                              <div style="font-size: 22px; font-weight: 900; letter-spacing: 0.08em; color: #0f172a; font-family: monospace;">
                                MENYPHIS20
                              </div>
                              <div style="font-size: 12px; color: #78350f; margin-top: 4px;">
                                Apply at checkout for <strong style="color: #b45309;">20% OFF</strong> your order.
                              </div>
                            </td>
                            <td align="right" style="vertical-align: middle;">
                              <div style="padding: 6px 14px; background: #000000; border-radius: 8px; font-size: 11px; font-weight: 900; color: #ffffff; text-transform: uppercase; letter-spacing: 0.06em;">
                                20% OFF
                              </div>
                            </td>
                          </tr>
                        </table>
                      </div>

                      <!-- Early Access Benefits -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px; font-size: 13px; color: #334155;">
                        <tr>
                          <td style="padding: 6px 0; color: #7c3aed; font-weight: 800; width: 22px;">✓</td>
                          <td style="padding: 6px 0;"><strong>Priority Drops:</strong> 15-minute advance window on exclusive oversized hoodies and graphic tees.</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #7c3aed; font-weight: 800; width: 22px;">✓</td>
                          <td style="padding: 6px 0;"><strong>Vault Restocks:</strong> Instant telemetry alerts when archived bestsellers restock.</td>
                        </tr>
                        <tr>
                          <td style="padding: 6px 0; color: #7c3aed; font-weight: 800; width: 22px;">✓</td>
                          <td style="padding: 6px 0;"><strong>Zero Spam:</strong> Only essential release dates, no filler.</td>
                        </tr>
                      </table>

                      <!-- CTA Button -->
                      <div style="text-align: center;">
                        <a 
                          href="${siteUrl}/shop" 
                          style="display: inline-block; width: 85%; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 10px; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 4px 14px rgba(0,0,0,0.12);"
                        >
                          Explore Live Drops Now →
                        </a>
                      </div>
                    </td>
                  </tr>

                  <!-- Barcode Footer -->
                  <tr>
                    <td style="padding: 22px 38px 28px; text-align: center; border-top: 1px solid #f1f5f9; background-color: #f8fafc;">
                      <div style="font-family: monospace; font-size: 15px; letter-spacing: 5px; color: #94a3b8; margin-bottom: 6px;">
                        ||| | ||||| || |||| ||| ||||| | || |||||
                      </div>
                      <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #64748b; font-weight: 700;">
                        PARIS • TOKYO • NEW YORK
                      </div>
                      <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">
                        © 2026 Menyphis Streetwear Marketplace. Authentic Archive.
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
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  }

  // Default: Order Confirmation
  const mockItems = [
    {
      name: 'Menyphis Cyber Acid Washed Oversized Hoodie',
      price: 4999,
      quantity: 1,
      size: 'L',
      color: 'Acid Grey / Washed Violet',
      store_name: 'Overkill Archives',
      image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80',
    },
    {
      name: 'Tokyo Neon Underground Boxy Graphic Tee',
      price: 2499,
      quantity: 2,
      size: 'XL',
      color: 'Obsidian Black',
      store_name: 'Tokyo Shibuya Lab',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80',
    }
  ];

  const subtotal = mockItems.reduce((s, i) => s + (i.price * i.quantity), 0);
  const discountAmount = 1999;
  const total = subtotal - discountAmount;
  const trackingUrl = `${siteUrl}/track?code=1042`;

  const itemsHtml = mockItems.map(item => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="width: 56px; padding: 14px 12px 14px 0; vertical-align: middle;">
        <img 
          src="${item.image}" 
          alt="${item.name}" 
          width="54" 
          height="54" 
          style="width: 54px; height: 54px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block; background-color: #f8fafc;"
        />
      </td>
      <td style="padding: 14px 8px 14px 0; vertical-align: middle;">
        <div style="font-weight: 800; color: #0f172a; font-size: 14px; letter-spacing: -0.01em; margin-bottom: 5px; text-transform: uppercase;">
          ${item.name}
        </div>
        <div style="font-size: 11px; color: #64748b; display: flex; gap: 6px; flex-wrap: wrap;">
          <span style="background: #f1f5f9; padding: 2px 7px; border-radius: 4px; color: #334155; font-weight: 600;">SIZE: ${item.size}</span>
          <span style="background: #f1f5f9; padding: 2px 7px; border-radius: 4px; color: #334155; font-weight: 600;">COLOR: ${item.color}</span>
          <span style="background: #ede9fe; color: #6d28d9; padding: 2px 7px; border-radius: 4px; font-weight: 700;">STORE: ${item.store_name.toUpperCase()}</span>
        </div>
      </td>
      <td style="padding: 14px 10px; text-align: center; color: #334155; font-size: 13px; font-weight: 700; vertical-align: middle;">
        <span style="background: #f8fafc; padding: 4px 9px; border-radius: 6px; border: 1px solid #e2e8f0; font-family: monospace;">
          ×${item.quantity}
        </span>
      </td>
      <td style="padding: 14px 0 14px 10px; text-align: right; font-weight: 800; color: #0f172a; font-size: 14px; vertical-align: middle; font-family: monospace;">
        ${formatCurrency(item.price * item.quantity)}
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation #1042 • Menyphis</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 36px 12px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.06);">
                
                <!-- Store Top Announcement Bar -->
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
                      You're Locked In, Hasaan.
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
                        <td style="font-size: 15px; font-weight: 900; color: #7c3aed; font-family: monospace;">#1042</td>
                        <td style="font-size: 13px; font-weight: 700; color: #0f172a; text-align: center;">Sep 12, 2026</td>
                        <td style="font-size: 12px; font-weight: 800; color: #059669; text-align: right;">PRIORITY</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Line Items Table -->
                <tr>
                  <td style="padding: 0 38px 24px 38px;">
                    <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; margin-bottom: 12px;">
                      MANIFEST ITEMS (${mockItems.length})
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
                      <tr>
                        <td style="padding: 5px 0; color: #059669; font-size: 13px; font-weight: 700;">VIP Voucher Discount</td>
                        <td style="padding: 5px 0; color: #059669; font-size: 13px; text-align: right; font-weight: 800; font-family: monospace;">-${formatCurrency(discountAmount)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; color: #64748b; font-size: 13px;">Express Shipping</td>
                        <td style="padding: 5px 0; text-align: right; font-weight: 700; font-size: 13px; font-family: monospace;">
                          <span style="color: #059669; font-weight: 800;">FREE EXPRESS</span>
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
                <tr>
                  <td style="padding: 0 38px 24px 38px;">
                    <div style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; padding: 16px 20px;">
                      <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #8b5cf6; margin-bottom: 6px;">
                        📍 DELIVERY COORDINATES
                      </div>
                      <div style="font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap; font-family: monospace;">Street 4, Sector F-8/2, Islamabad, 44000</div>
                    </div>
                  </td>
                </tr>

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
                            <a href="${siteUrl}/shop" style="display: inline-block; padding: 7px 14px; background: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em;">
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

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
