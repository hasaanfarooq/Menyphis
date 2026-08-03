import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const categories = await sql`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.id
    `;
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
