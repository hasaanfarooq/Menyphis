import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { resend } from '@/lib/email';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  source: z.string().optional().default('maintenance_mode')
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = emailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const { email, source } = parsed.data;

    // Ensure table exists
    await sql.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        source VARCHAR(50) DEFAULT 'maintenance_mode',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert subscriber
    await sql.query(`
      INSERT INTO newsletter_subscribers (email, source)
      VALUES ($1, $2)
      ON CONFLICT (email) DO NOTHING
    `, [email.toLowerCase().trim(), source]);

    // Optional confirmation email via Resend
    try {
      if (process.env.RESEND_API_KEY) {
        const fromAddress = process.env.RESEND_FROM_EMAIL || 'Menyphis <onboarding@resend.dev>';
        const isSandbox = fromAddress.includes('resend.dev');
        const actualRecipient = isSandbox ? (process.env.ADMIN_NOTIFY_EMAIL || 'hasaanf987@gmail.com') : email;
        const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

        await resend.emails.send({
          from: fromAddress,
          to: [actualRecipient],
          subject: 'Menyphis • VIP Drop Pass Activated [Early Access Granted]',
          html: `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <title>Menyphis VIP Pass</title>
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
                              You&apos;re on the Inside.
                            </h1>
                            <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
                              Your email (${email}) has been provisioned with priority access. When limited-quantity collections and vault archives drop, you will receive notifications 15 minutes before public launch.
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
          `,
        }).catch(e => console.error('Newsletter confirmation email error:', e));
      }
    } catch {}

    return NextResponse.json({ success: true, message: "You're on the list! We'll notify you the moment doors reopen." });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
