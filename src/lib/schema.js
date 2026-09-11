import { sql } from './db.js';
import bcrypt from 'bcryptjs';

export async function initializeDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      is_admin BOOLEAN DEFAULT false,
      role VARCHAR(50) DEFAULT 'customer',
      store_id INT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS stores (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      tagline VARCHAR(255),
      description TEXT,
      logo_url TEXT,
      banner_url TEXT,
      owner_id INT REFERENCES users(id) ON DELETE SET NULL,
      is_featured BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      rating DECIMAL(3,2) DEFAULT 5.0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id) ON DELETE SET NULL`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS color_images JSONB DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}'::text[]`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS total_sold INT DEFAULT 0`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_order INT DEFAULT 0`;
  await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id) ON DELETE SET NULL`;

  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.0`;
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS pending_payout DECIMAL(10,2) DEFAULT 0.0`;
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS total_paid_out DECIMAL(10,2) DEFAULT 0.0`;
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account_title VARCHAR(255)`;
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255)`;
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(255)`;
  await sql`ALTER TABLE stores ADD COLUMN IF NOT EXISTS bank_iban VARCHAR(255)`;

  await sql`
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      type VARCHAR(50) NOT NULL DEFAULT 'percentage',
      value DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_order_amount DECIMAL(10,2) DEFAULT 0,
      max_discount_amount DECIMAL(10,2),
      usage_limit INT,
      used_count INT DEFAULT 0,
      per_user_limit INT DEFAULT 1,
      starts_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP,
      is_active BOOLEAN DEFAULT true,
      first_order_only BOOLEAN DEFAULT false,
      store_id INT REFERENCES stores(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS coupon_uses (
      id SERIAL PRIMARY KEY,
      coupon_id INT REFERENCES coupons(id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE SET NULL,
      order_id INT REFERENCES orders(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE flash_sales ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS store_id INT REFERENCES stores(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS categories_global_slug_idx ON categories (slug) WHERE store_id IS NULL`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS categories_store_slug_idx ON categories (store_id, slug) WHERE store_id IS NOT NULL`;

  await sql`
    CREATE TABLE IF NOT EXISTS payouts (
      id SERIAL PRIMARY KEY,
      store_id INT REFERENCES stores(id) ON DELETE CASCADE,
      amount DECIMAL(10,2) NOT NULL,
      commission_deducted DECIMAL(10,2) DEFAULT 0,
      gross_sales DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      transaction_reference VARCHAR(255),
      created_at TIMESTAMP DEFAULT NOW(),
      processed_at TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL,
      description TEXT,
      image_url TEXT,
      store_id INT REFERENCES stores(id) ON DELETE CASCADE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      compare_price DECIMAL(10,2),
      category_id INT REFERENCES categories(id),
      image_url TEXT NOT NULL,
      images TEXT[],
      colors TEXT[],
      sizes TEXT[],
      color_images JSONB DEFAULT '{}'::jsonb,
      features TEXT[] DEFAULT '{}'::text[],
      stock INT DEFAULT 0,
      featured BOOLEAN DEFAULT false,
      trending BOOLEAN DEFAULT false,
      rating DECIMAL(3,2) DEFAULT 0,
      review_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        shipping_address TEXT NOT NULL,
        tracking_number VARCHAR(255),
        carrier VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INT REFERENCES orders(id),
      product_id INT REFERENCES products(id),
      quantity INT NOT NULL,
      size VARCHAR(10),
      color VARCHAR(50),
      price DECIMAL(10,2) NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id INT REFERENCES products(id),
      user_id INT REFERENCES users(id),
      rating INT CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS wishlist (
      id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id),
      product_id INT REFERENCES products(id),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, product_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS flash_sales (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      subtitle TEXT,
      discount_percent INT NOT NULL DEFAULT 0,
      starts_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ends_at TIMESTAMP NOT NULL,
      is_active BOOLEAN DEFAULT true,
      badge_text VARCHAR(100) DEFAULT 'FLASH SALE',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS flash_sale_products (
      id SERIAL PRIMARY KEY,
      flash_sale_id INT REFERENCES flash_sales(id) ON DELETE CASCADE,
      product_id INT REFERENCES products(id) ON DELETE CASCADE,
      custom_discount_percent INT,
      UNIQUE(flash_sale_id, product_id)
    )
  `;
}

export async function seedDatabase() {
  // Proceed with seeding/updating

  // #2 FIX: Admin password from env var — never hardcode credentials in source code
  const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD;
  const adminSeedEmail = process.env.ADMIN_SEED_EMAIL;
  if (!adminSeedPassword || !adminSeedEmail) {
    console.warn('ADMIN_SEED_PASSWORD or ADMIN_SEED_EMAIL not set — skipping admin seed.');
  } else {
    const adminPassword = await bcrypt.hash(adminSeedPassword, 12);
    await sql`
      INSERT INTO users (name, email, password_hash, is_admin)
      VALUES ('Admin', ${adminSeedEmail}, ${adminPassword}, true)
      ON CONFLICT (email) DO UPDATE SET is_admin = true, password_hash = EXCLUDED.password_hash
    `;
  }

  // Insert categories
  await sql`
    INSERT INTO categories (name, slug, description, image_url) VALUES
    ('Shirts', 'shirts', 'Premium designed shirts for every style', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400'),
    ('Hoodies', 'hoodies', 'Cozy streetwear hoodies with bold designs', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400'),
    ('Limited Edition', 'limited-edition', 'Exclusive drops - once they are gone, they are gone', 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400'),
    ('New Arrivals', 'new-arrivals', 'Fresh drops just landed', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400')
    ON CONFLICT (slug) DO NOTHING
  `;

  const categories = await sql`SELECT id, slug FROM categories`;
  const catMap = {};
  categories.forEach(c => { catMap[c.slug] = c.id; });

  // Insert products
  await sql`
    INSERT INTO products (name, slug, description, price, compare_price, category_id, image_url, colors, sizes, stock, featured, trending, rating, review_count) VALUES
    ('Shadow Vortex Tee', 'shadow-vortex-tee', 'A dark abstract vortex design that pulls you in. Premium 100% cotton with screen-printed graphics that never fade.', 39.99, 59.99, ${catMap['shirts']}, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600', ARRAY['Black', 'Charcoal', 'Navy'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 150, true, true, 4.8, 234),
    
    ('Neon Pulse Hoodie', 'neon-pulse-hoodie', 'Electric neon graphics on premium heavyweight fleece. Kangaroo pocket, adjustable drawstring hood. The hoodie that glows different.', 79.99, 99.99, ${catMap['hoodies']}, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600', ARRAY['Black', 'Purple', 'Dark Green'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 80, true, true, 4.9, 456),
    
    ('Retro Grid Shirt', 'retro-grid-shirt', 'Throwback 80s grid design meets modern streetwear. Lightweight breathable fabric perfect for layering.', 34.99, 49.99, ${catMap['shirts']}, 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600', ARRAY['White', 'Black', 'Pink'], ARRAY['S', 'M', 'L', 'XL'], 200, true, false, 4.6, 189),
    
    ('Midnight Drip Hoodie', 'midnight-drip-hoodie', 'Paint drip effect in midnight blues and purples. Oversized fit, brushed fleece interior. Art you can wear.', 84.99, 109.99, ${catMap['hoodies']}, '/mock/midnight-drip.png', ARRAY['Midnight Blue', 'Black', 'Grey'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 60, true, true, 4.7, 312),
    
    ('Glitch Effect Tee', 'glitch-effect-tee', 'Digital glitch art printed on premium cotton. The design that breaks reality. Unisex relaxed fit.', 36.99, 54.99, ${catMap['shirts']}, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600', ARRAY['Black', 'White', 'Red'], ARRAY['S', 'M', 'L', 'XL'], 175, false, true, 4.5, 167),
    
    ('Aurora Borealis Hoodie', 'aurora-borealis-hoodie', 'Northern lights gradient across premium fleece. Zip-up design with embroidered logo. Cosmic comfort.', 89.99, 119.99, ${catMap['hoodies']}, 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=600', ARRAY['Aurora Green', 'Deep Purple', 'Black'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 45, true, false, 4.9, 521),
    
    ('Cyber Samurai Tee', 'cyber-samurai-tee', 'Futuristic samurai artwork with neon accents. Japanese-inspired streetwear at its finest. Premium heavyweight cotton.', 42.99, 64.99, ${catMap['shirts']}, 'https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=600', ARRAY['Black', 'Dark Red', 'Navy'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 120, false, true, 4.7, 278),
    
    ('Phantom Oversized Hoodie', 'phantom-oversized-hoodie', 'Minimalist phantom embroidery on ultra-soft oversized hoodie. Drop shoulders, ribbed cuffs. Premium comfort.', 74.99, 94.99, ${catMap['hoodies']}, 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600', ARRAY['Phantom Black', 'Ghost White', 'Slate'], ARRAY['S', 'M', 'L', 'XL'], 90, false, false, 4.6, 198),
    
    ('Fractal Mind Tee', 'fractal-mind-tee', 'Mathematical fractal patterns rendered in vivid color. Limited print run. For the thinkers and dreamers.', 44.99, 69.99, ${catMap['limited-edition']}, 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600', ARRAY['Black', 'White'], ARRAY['S', 'M', 'L', 'XL'], 50, true, true, 4.8, 89),
    
    ('Digital Bloom Hoodie', 'digital-bloom-hoodie', 'Floral patterns reimagined through a digital lens. All-over print on premium French terry. Unisex.', 92.99, 129.99, ${catMap['limited-edition']}, '/mock/digital-bloom.png', ARRAY['Multi', 'Black Base', 'White Base'], ARRAY['S', 'M', 'L', 'XL'], 30, true, false, 5.0, 67),
    
    ('Static Noise Tee', 'static-noise-tee', 'TV static pattern with hidden messages. Glow-in-the-dark ink reveals a secret design at night.', 38.99, 54.99, ${catMap['new-arrivals']}, 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600', ARRAY['Black', 'Grey', 'White'], ARRAY['S', 'M', 'L', 'XL', 'XXL'], 200, false, true, 4.4, 45),
    
    ('Cloud Walker Hoodie', 'cloud-walker-hoodie', 'Cloud-soft interior with embossed cloud pattern exterior. Relaxed fit, dropped hem. Walk on clouds.', 69.99, 89.99, ${catMap['new-arrivals']}, '/mock/cloud-walker.png', ARRAY['Cloud White', 'Sky Blue', 'Storm Grey'], ARRAY['S', 'M', 'L', 'XL'], 110, false, false, 4.3, 23)
    ON CONFLICT (slug) DO UPDATE SET image_url = EXCLUDED.image_url
  `;

  const count = await sql`SELECT COUNT(*) as count FROM products`;
  return { message: 'Database seeded successfully', count: parseInt(count[0].count) };
}
