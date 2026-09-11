import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    let query = `
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
        COALESCE(
          (SELECT ROUND(AVG(p_sub.rating)::numeric, 1) 
           FROM products p_sub 
           WHERE p_sub.store_id = s.id AND p_sub.rating > 0),
          s.rating,
          5.0
        ) as rating,
        s.created_at,
        COUNT(p.id) as product_count,
        COALESCE(
          (SELECT json_agg(sub) FROM (
            SELECT id, name, slug, image_url, price 
            FROM products 
            WHERE store_id = s.id 
            ORDER BY featured DESC, id DESC 
            LIMIT 3
          ) sub), '[]'::json
        ) as preview_products
      FROM stores s
      LEFT JOIN products p ON s.id = p.store_id
      WHERE s.is_active = true
    `;

    const values = [];
    if (featured === 'true') {
      values.push(true);
      query += ` AND s.is_featured = $${values.length}`;
    }

    query += ` GROUP BY s.id ORDER BY s.is_featured DESC, s.rating DESC, s.created_at DESC`;

    if (limit && !isNaN(parseInt(limit))) {
      values.push(parseInt(limit));
      query += ` LIMIT $${values.length}`;
    }

    const stores = await sql.query(query, values);
    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}
