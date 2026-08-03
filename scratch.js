const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function run() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(100) PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('site_settings table created');

  // Insert default settings
  const defaults = [
    // General
    ['site_name', '"Menyphis"'],
    ['site_tagline', '"Premium Streetwear — Bold by Nature"'],
    ['site_description', '"Bold designs, unmatched quality. Premium streetwear for those who dare to stand out."'],
    ['contact_email', '"hello@menyphis.com"'],
    ['contact_phone', '"+1 (555) 000-0000"'],
    ['contact_address', '"123 Fashion Street, New York, NY 10001"'],
    // Social
    ['social_instagram', '"https://instagram.com/menyphis"'],
    ['social_twitter', '"https://twitter.com/menyphis"'],
    ['social_tiktok', '"https://tiktok.com/@menyphis"'],
    ['social_youtube', '"https://youtube.com/@menyphis"'],
    ['social_facebook', '"https://facebook.com/menyphis"'],
    // Commerce
    ['currency_default', '"USD"'],
    ['free_shipping_threshold', '99'],
    ['tax_rate', '0'],
    ['guest_checkout', 'true'],
    ['low_stock_threshold', '5'],
    // Appearance
    ['primary_color', '"#6366f1"'],
    ['font_family', '"Inter"'],
    ['default_theme', '"dark"'],
    ['custom_css', '""'],
    // SEO
    ['seo_title', '"Menyphis — Premium Streetwear"'],
    ['seo_description', '"Shop premium streetwear shirts and hoodies at Menyphis."'],
    ['seo_og_image', '""'],
    ['google_analytics_id', '""'],
    // Maintenance
    ['maintenance_mode', 'false'],
    ['maintenance_message', '"We\'re upgrading the store. Back soon!"'],
    ['registration_open', 'true'],
    // Notifications
    ['notify_new_order', 'true'],
    ['notify_low_stock', 'true'],
    ['notify_new_review', 'false'],
    ['admin_notify_email', '"admin@menyphis.com"'],
    // Shipping
    ['shipping_zones', '[]'],
    ['default_shipping_cost', '0'],
    // Legal / Footer
    ['footer_copyright', '"© 2026 Menyphis. All rights reserved."'],
    ['footer_tagline', '"Premium streetwear brand crafting bold, unique designs for those who dare to stand out."'],
    ['returns_policy_url', '"#"'],
    ['privacy_policy_url', '"#"'],
    ['terms_url', '"#"'],
  ];

  for (const [key, value] of defaults) {
    await sql.query(`
      INSERT INTO site_settings (key, value) VALUES ($1, $2::jsonb)
      ON CONFLICT (key) DO NOTHING
    `, [key, value]);
  }
  console.log('Default settings inserted');
}

run().catch(console.error);
