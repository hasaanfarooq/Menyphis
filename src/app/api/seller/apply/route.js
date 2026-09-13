import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { resend, ADMIN_EMAIL } from '@/lib/email';
import { z } from 'zod';

const applicationSchema = z.object({
  brand_name: z.string().min(2, 'Brand name is required'),
  contact_name: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional().nullable(),
  website_or_social: z.string().min(2, 'Instagram handle or website is required'),
  category: z.string().optional().nullable(),
  description: z.string().min(10, 'Please tell us a bit about your brand catalog'),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = applicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid application details', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      brand_name,
      contact_name,
      email,
      phone,
      website_or_social,
      category,
      description,
    } = parsed.data;

    // Ensure table exists
    await sql.query(`
      CREATE TABLE IF NOT EXISTS seller_applications (
        id SERIAL PRIMARY KEY,
        brand_name VARCHAR(255) NOT NULL,
        contact_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(100),
        website_or_social VARCHAR(255),
        category VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert application
    const result = await sql.query(
      `INSERT INTO seller_applications (brand_name, contact_name, email, phone, website_or_social, category, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING id, created_at`,
      [brand_name, contact_name, email, phone || null, website_or_social, category || null, description]
    );

    const rows = Array.isArray(result) ? result : (result.rows || result);
    const applicationId = rows[0]?.id;

    // Send email alert to platform administrator
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'Menyphis <onboarding@resend.dev>',
          to: [ADMIN_EMAIL],
          subject: `New Brand Partner Application: ${brand_name} • Menyphis`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #0f172a; max-width: 600px;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">New Brand Partner Application</h2>
              <p style="color: #64748b; font-size: 14px;">A new brand has applied to open a storefront on Menyphis marketplace.</p>
              
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0;">
                <p style="margin: 6px 0;"><strong>Brand:</strong> ${brand_name}</p>
                <p style="margin: 6px 0;"><strong>Contact:</strong> ${contact_name}</p>
                <p style="margin: 6px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 6px 0;"><strong>Phone / WhatsApp:</strong> ${phone || 'N/A'}</p>
                <p style="margin: 6px 0;"><strong>Social / Portfolio:</strong> ${website_or_social}</p>
                <p style="margin: 6px 0;"><strong>Category:</strong> ${category || 'General Streetwear'}</p>
                <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
                  <strong>Brand Description:</strong>
                  <p style="color: #334155; margin-top: 4px; line-height: 1.5;">${description}</p>
                </div>
              </div>

              <p style="font-size: 12px; color: #94a3b8;">You can review and provision store credentials in your Menyphis Admin Portal.</p>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.warn('[Admin Alert Email Failed]', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Your partner application has been received! Our curation team will review your portfolio and reach out.',
      applicationId,
    });
  } catch (error) {
    console.error('[Seller Apply Route Error]', error);
    return NextResponse.json(
      { error: 'Failed to submit partner application. Please try again.' },
      { status: 500 }
    );
  }
}
