import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Public safe settings only — no secrets exposed
const PUBLIC_KEYS = [
  'site_name', 'site_tagline', 'site_description',
  'contact_email', 'contact_phone', 'contact_address',
  'social_instagram', 'social_twitter', 'social_tiktok', 'social_youtube', 'social_facebook',
  'currency_default', 'free_shipping_threshold',
  'primary_color', 'font_family', 'default_theme', 'custom_css',
  'seo_title', 'seo_description', 'seo_og_image',
  'maintenance_mode', 'maintenance_message', 'registration_open',
  'footer_copyright', 'footer_tagline',
  'returns_policy_url', 'privacy_policy_url', 'terms_url',
  'default_shipping_cost',
];

export async function GET() {
  try {
    const rows = await sql.query(
      `SELECT key, value FROM site_settings WHERE key = ANY($1::text[])`,
      [PUBLIC_KEYS]
    );
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });
  } catch (e) {
    return NextResponse.json({}, { status: 200 });
  }
}
