import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const storeRows = await sql.query(`
      SELECT 
        s.id,
        s.name,
        s.slug,
        s.tagline,
        s.description,
        s.logo_url,
        s.banner_url,
        s.is_featured,
        s.is_active,
        s.rating,
        s.created_at,
        COUNT(p.id) as product_count
      FROM stores s
      LEFT JOIN products p ON s.id = p.store_id
      WHERE s.slug = $1 AND s.is_active = true
      GROUP BY s.id
    `, [slug]);

    if (storeRows.length === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const store = storeRows[0];

    // Fetch store products
    const products = await sql.query(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.store_id = $1
      ORDER BY p.featured DESC, p.created_at DESC
    `, [store.id]);

    // Fetch categories available in this store (both custom store categories and categories with store products)
    const categories = await sql.query(`
      SELECT DISTINCT 
        c.id, c.name, c.slug, c.image_url, c.store_id
      FROM categories c
      WHERE c.store_id = $1 
         OR c.id IN (SELECT DISTINCT p.category_id FROM products p WHERE p.store_id = $1 AND p.category_id IS NOT NULL)
      ORDER BY c.name ASC
    `, [store.id]);

    // Fetch active store coupons
    const coupons = await sql.query(`
      SELECT id, code, type as discount_type, value as discount_value, min_order_amount, expires_at
      FROM coupons
      WHERE store_id = $1 
        AND is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
    `, [store.id]);

    // Fetch active store sale / promotion if any
    const saleRows = await sql.query(`
      SELECT fs.id, fs.title, fs.subtitle, fs.discount_percent, fs.badge_text, fs.ends_at
      FROM flash_sales fs
      WHERE fs.store_id = $1 
        AND fs.is_active = true 
        AND fs.ends_at > NOW()
      ORDER BY fs.ends_at ASC
      LIMIT 1
    `, [store.id]);

    const activeSale = saleRows.length > 0 ? saleRows[0] : null;

    return NextResponse.json({
      store,
      products,
      categories,
      coupons,
      activeSale
    });
  } catch (error) {
    console.error('Error fetching store by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 });
  }
}
