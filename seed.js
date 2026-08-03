const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    console.log('Clearing existing data...');
    await sql.query('DELETE FROM reviews;');
    await sql.query('DELETE FROM wishlist;');
    await sql.query('DELETE FROM order_items;');
    await sql.query('DELETE FROM orders;');
    await sql.query('DELETE FROM flash_sales;');
    await sql.query('DELETE FROM products;');
    await sql.query('DELETE FROM categories;');
    await sql.query('DELETE FROM hero_slides;');
    await sql.query('DELETE FROM site_banners;');
    await sql.query('DELETE FROM coupons;');

    // 1. Seed Categories
    console.log('Seeding categories...');
    const categoriesRes = await sql.query(`
      INSERT INTO categories (name, slug, description, image_url) VALUES 
      ('Graphic Tees', 'graphic-tees', 'Bold, statement-making graphic t-shirts.', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'),
      ('Hoodies & Sweatshirts', 'hoodies', 'Premium heavy-weight hoodies for the streets.', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80'),
      ('Outerwear', 'outerwear', 'Jackets and coats built for any weather.', 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=800&q=80'),
      ('Accessories', 'accessories', 'Caps, beanies, and bags to complete the look.', 'https://images.unsplash.com/photo-1556306535-0f09a536f01f?w=800&q=80'),
      ('Limited Edition', 'limited-edition', 'Exclusive drops. Once they are gone, they are gone.', 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&q=80')
      RETURNING id, slug;
    `);
    const catMap = {};
    categoriesRes.forEach(c => catMap[c.slug] = c.id);

    // 2. Seed Products
    console.log('Seeding products...');
    const productsRes = await sql.query(`
      INSERT INTO products (category_id, name, slug, description, price, stock, image_url, images, sizes, colors) VALUES
      ($1, 'Cyberpunk Overdrive Tee', 'cyberpunk-overdrive-tee', 'A futuristic graphic tee featuring neon accents and a relaxed fit. 100% organic cotton.', 35.00, 150, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80', '{"https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80"}', '{"S", "M", "L", "XL"}', '{"Black", "White"}'),
      ($1, 'Vintage Wash Skull Logo Tee', 'vintage-wash-skull-tee', 'Acid-washed for a vintage feel with our signature skull logo distressed on the front.', 40.00, 85, 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80', '{"https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80"}', '{"S", "M", "L", "XL", "XXL"}', '{"Charcoal"}'),
      ($2, 'Heavyweight Essential Hoodie', 'heavyweight-essential-hoodie', '500gsm french terry cotton hoodie. Built to last a lifetime. Dropped shoulders, boxy fit.', 85.00, 200, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80', '{"https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80"}', '{"M", "L", "XL"}', '{"Black", "Heather Grey", "Olive"}'),
      ($2, 'Reflective Tech Pullover', 'reflective-tech-pullover', 'Nylon-blend pullover with 3M reflective piping and an adjustable bungee hem.', 95.00, 45, 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&q=80', '{"https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&q=80"}', '{"S", "M", "L"}', '{"Silver", "Black"}'),
      ($3, 'Tactical Cargo Vest', 'tactical-cargo-vest', 'Multi-pocket utility vest with mesh lining and adjustable straps.', 110.00, 30, 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80', '{"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80"}', '{"M", "L"}', '{"Camo", "Black"}'),
      ($3, 'Oversized Puffer Jacket', 'oversized-puffer-jacket', 'Stay warm. Look cold. Extreme oversized puffer jacket with down-alternative fill.', 150.00, 20, 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80', '{"https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80"}', '{"S", "M", "L", "XL"}', '{"Black", "Safety Orange"}'),
      ($4, 'Signature Logo Beanie', 'signature-logo-beanie', 'Chunky knit beanie with a folded cuff and embroidered logo.', 25.00, 300, 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80', '{"https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&q=80"}', '{"OS"}', '{"Black", "Neon Green"}'),
      ($4, 'Crossbody Utility Bag', 'crossbody-utility-bag', 'Water-resistant crossbody bag with magnetic buckles.', 45.00, 120, 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80', '{"https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80"}', '{"OS"}', '{"Black"}'),
      ($5, 'Menyphis x Tokyo Drift Hoodie', 'menyphis-tokyo-drift-hoodie', 'Extremely limited collaboration piece. Individually numbered 1 of 50.', 180.00, 50, 'https://images.unsplash.com/photo-1608063615781-e2ef8c73d114?w=800&q=80', '{"https://images.unsplash.com/photo-1608063615781-e2ef8c73d114?w=800&q=80"}', '{"M", "L"}', '{"Midnight Purple"}'),
      ($5, 'Acid Spill Carpenter Pants', 'acid-spill-carpenter-pants', 'Hand-dyed heavy canvas pants. No two pairs are exactly alike.', 130.00, 40, 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80', '{"https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80"}', '{"30", "32", "34", "36"}', '{"Acid Black"}')
      RETURNING id, slug;
    `, [catMap['graphic-tees'], catMap['hoodies'], catMap['outerwear'], catMap['accessories'], catMap['limited-edition']]);

    // 3. Seed Hero Slides
    console.log('Seeding hero slides...');
    await sql.query(`
      INSERT INTO hero_slides (title, subtitle, badge_text, cta_text, cta_link, cta_secondary_text, cta_secondary_link, image_url, overlay_color, text_color, text_align, sort_order, is_active) VALUES
      ('New Season. New Rules.', 'The Fall/Winter 2026 collection has arrived. Defy expectations.', 'FW26 DROP 1', 'Shop Collection', '/shop', 'View Lookbook', '/lookbook', 'https://images.unsplash.com/photo-1512353087810-254cb9859f6e?w=1600&q=80', 'rgba(0,0,0,0.5)', '#ffffff', 'left', 1, true),
      ('Heavyweight Comfort.', 'Premium 500gsm cotton hoodies designed for the cold streets.', 'BEST SELLER', 'Shop Hoodies', '/shop?category=hoodies', '', '', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1600&q=80', 'rgba(0,0,0,0.4)', '#ffffff', 'center', 2, true),
      ('Limited Edition Collaboration', 'Menyphis x Tokyo Underground. Only 50 pieces made worldwide.', 'SOLD OUT FAST', 'Discover More', '/shop?category=limited-edition', '', '', 'https://images.unsplash.com/photo-1505022610485-0249ba5b3675?w=1600&q=80', 'rgba(100,0,150,0.4)', '#ffffff', 'right', 3, true)
    `);

    // 4. Seed Banners
    console.log('Seeding banners...');
    await sql.query(`
      INSERT INTO site_banners (placement, title, subtitle, cta_text, cta_link, bg_color, text_color, is_active, extra_config) VALUES
      ('announcement_bar', 'FREE WORLDWIDE SHIPPING ON ALL ORDERS OVER $100', '', 'Shop Now', '/shop', '#1e293b', '#ffffff', true, '{"icon": "✈️", "dismissable": true}'::jsonb),
      ('popup', 'Join the Movement', 'Get 15% off your first order when you sign up for our newsletter.', 'Sign Up', '/register', '#ffffff', '#000000', true, '{"delay_seconds": 5}'::jsonb),
      ('promo_strip', 'THE SUMMER ARCHIVE SALE', 'Up to 60% off past season favorites. Limited time only.', 'Shop the Sale', '/shop', '#ef4444', '#ffffff', true, '{}'::jsonb)
    `);
    // Add image for popup
    await sql.query(`UPDATE site_banners SET image_url = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80' WHERE placement = 'popup'`);

    // 5. Seed Coupons
    console.log('Seeding coupons...');
    await sql.query(`
      INSERT INTO coupons (code, type, value, min_order_amount, usage_limit, is_active, starts_at, expires_at) VALUES
      ('WELCOME15', 'percentage', 15.00, 0.00, 1000, true, NOW(), NOW() + INTERVAL '1 year'),
      ('FREESHIP', 'fixed', 0.00, 50.00, 500, true, NOW(), NOW() + INTERVAL '30 days'),
      ('MINUS20', 'fixed', 20.00, 100.00, 100, true, NOW(), NOW() + INTERVAL '7 days')
    `);

    console.log('✅ Database successfully seeded!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seed().then(() => process.exit(0));
