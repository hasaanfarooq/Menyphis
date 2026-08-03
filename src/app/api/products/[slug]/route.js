import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { slug } = await params;

    const products = await sql`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.slug = ${slug}
      LIMIT 1
    `;

    if (products.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get related products from same category
    const related = await sql`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.category_id = ${products[0].category_id}
        AND p.id != ${products[0].id}
      ORDER BY p.rating DESC
      LIMIT 4
    `;

    return NextResponse.json({
      product: products[0],
      related
    });
  } catch (error) {
    console.error('Product detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
