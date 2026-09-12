import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { resend } from '@/lib/email';

export async function POST(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const recipient = body.email || adminCtx.email;

    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Menyphis <onboarding@resend.dev>';

    const isSandbox = fromAddress.includes('resend.dev');
    const actualRecipient = isSandbox ? (process.env.ADMIN_NOTIFY_EMAIL || 'hasaanf987@gmail.com') : recipient;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [actualRecipient],
      subject: 'Menyphis • Resend Telemetry & Dispatch System Online',
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <title>Menyphis Telemetry System Test</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 36px 12px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.06);">
                    
                    <!-- Accent Strip -->
                    <tr>
                      <td style="height: 3px; background: linear-gradient(90deg, #6366f1 0%, #ec4899 50%, #8b5cf6 100%);"></td>
                    </tr>

                    <!-- Header -->
                    <tr>
                      <td style="padding: 32px 38px 22px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="left">
                              <div style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; color: #0f172a;">
                                MENYPHIS
                              </div>
                              <div style="font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #6366f1; font-weight: 800; margin-top: 4px;">
                                System Telemetry // Resend Engine Online
                              </div>
                            </td>
                            <td align="right">
                              <div style="display: inline-block; padding: 5px 12px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 999px; font-size: 10px; font-weight: 800; color: #059669; letter-spacing: 0.08em; text-transform: uppercase;">
                                ● Operational
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                      <td style="padding: 32px 38px;">
                        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: #6366f1; text-transform: uppercase; margin-bottom: 8px;">
                          DISPATCH NODE VERIFICATION
                        </div>
                        <h1 style="font-size: 22px; font-weight: 900; color: #0f172a; margin: 0 0 12px 0; letter-spacing: -0.02em;">
                          Email Pipeline Verified & Synced
                        </h1>
                        <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
                          Your Resend API connection is fully authenticated. Automated customer order receipts, multi-tenant vendor notifications, and VIP drop alerts will dispatch seamlessly in the light theme.
                        </p>

                        <!-- Telemetry Grid -->
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                          <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #64748b; margin-bottom: 12px;">
                            ENGINE TELEMETRY SPECS
                          </div>
                          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 13px; font-family: monospace;">
                            <tr>
                              <td style="color: #64748b; padding: 5px 0;">Sender Identity</td>
                              <td style="color: #0f172a; text-align: right; font-weight: 700;">${fromAddress}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; padding: 5px 0;">Target Endpoint</td>
                              <td style="color: #6366f1; text-align: right; font-weight: 700;">${actualRecipient}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; padding: 5px 0;">Dispatch Protocol</td>
                              <td style="color: #059669; text-align: right; font-weight: 800;">RESEND_REST_V1</td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; padding: 5px 0;">Timestamp</td>
                              <td style="color: #334155; text-align: right;">${new Date().toUTCString()}</td>
                            </tr>
                          </table>
                        </div>

                        <!-- Streetwear Button -->
                        <div style="text-align: center;">
                          <a 
                            href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin" 
                            style="display: inline-block; width: 85%; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 13px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; box-shadow: 0 4px 14px rgba(0,0,0,0.12);"
                          >
                            Return to Admin Dashboard →
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
                          © 2026 Menyphis Streetwear Marketplace. System Core.
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
    });

    if (error) {
      return NextResponse.json({ error: error.message || error }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data?.id, recipient, from: fromAddress });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 });
  }
}
