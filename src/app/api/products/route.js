import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const trending = searchParams.get('trending');
    const sort = searchParams.get('sort') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND c.slug = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (featured === 'true') {
      query += ` AND p.featured = true`;
    }

    if (trending === 'true') {
      query += ` AND p.trending = true`;
    }

    switch (sort) {
      case 'price-low':
        query += ' ORDER BY p.price ASC';
        break;
      case 'price-high':
        query += ' ORDER BY p.price DESC';
        break;
      case 'popular':
        query += ' ORDER BY p.review_count DESC';
        break;
      case 'rating':
        query += ' ORDER BY p.rating DESC';
        break;
      default:
        query += ' ORDER BY p.created_at DESC';
    }

    query += ` LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await sql.query(query, params);
    const products = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
