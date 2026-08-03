import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all flash sales (admin)
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sales = await sql.query(`
      SELECT fs.*, COUNT(fsp.id)::int as product_count
      FROM flash_sales fs
      LEFT JOIN flash_sale_products fsp ON fs.id = fsp.flash_sale_id
      GROUP BY fs.id
      ORDER BY fs.created_at DESC
    `);

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Admin flash sales GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
  }
}

// POST create new flash sale
export async function POST(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, subtitle, discount_percent, starts_at, ends_at, badge_text, product_ids, is_active } = body;

    if (!title || !ends_at || discount_percent === undefined) {
      return NextResponse.json({ error: 'title, ends_at, and discount_percent are required' }, { status: 400 });
    }

    // If activating this sale, deactivate all others
    if (is_active) {
      await sql.query(`UPDATE flash_sales SET is_active = false`);
    }

    const result = await sql.query(`
      INSERT INTO flash_sales (title, subtitle, discount_percent, starts_at, ends_at, badge_text, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      title,
      subtitle || null,
      parseInt(discount_percent),
      starts_at || new Date().toISOString(),
      ends_at,
      badge_text || 'FLASH SALE',
      is_active ?? false,
    ]);

    const sale = result[0];

    // Insert products
    if (product_ids && product_ids.length > 0) {
      for (const item of product_ids) {
        const pid = typeof item === 'object' ? item.product_id : item;
        const customDiscount = typeof item === 'object' ? item.custom_discount_percent : null;
        await sql.query(
          `INSERT INTO flash_sale_products (flash_sale_id, product_id, custom_discount_percent) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [sale.id, pid, customDiscount || null]
        );
      }
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error('Create flash sale error:', error);
    return NextResponse.json({ error: 'Failed to create flash sale' }, { status: 500 });
  }
}
