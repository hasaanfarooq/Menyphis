import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET active flash sale with its products (public endpoint)
export async function GET() {
  try {
    // Get the currently active sale (is_active=true AND not expired)
    const sales = await sql.query(`
      SELECT * FROM flash_sales
      WHERE is_active = true AND ends_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (!sales || sales.length === 0) {
      return NextResponse.json(null);
    }

    const sale = sales[0];

    // Get products for this sale with computed sale prices
    const products = await sql.query(`
      SELECT 
        p.*,
        fsp.custom_discount_percent,
        COALESCE(fsp.custom_discount_percent, $1) as effective_discount,
        ROUND(p.price * (1 - COALESCE(fsp.custom_discount_percent, $1) / 100.0), 2) as sale_price
      FROM flash_sale_products fsp
      JOIN products p ON p.id = fsp.product_id
      WHERE fsp.flash_sale_id = $2
      ORDER BY fsp.id
    `, [sale.discount_percent, sale.id]);

    return NextResponse.json({ ...sale, products });
  } catch (error) {
    console.error('Flash sale API error:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sale' }, { status: 500 });
  }
}
