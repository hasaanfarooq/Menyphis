import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';

// GET flash sales (admin)
export async function GET() {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let query = `
      SELECT fs.*,
        s.name as store_name,
        s.slug as store_slug,
        COUNT(fsp.id)::int as product_count
      FROM flash_sales fs
      LEFT JOIN stores s ON fs.store_id = s.id
      LEFT JOIN flash_sale_products fsp ON fs.id = fsp.flash_sale_id
    `;
    const params = [];

    if (adminCtx.isStoreAdmin) {
      query += ` WHERE fs.store_id = $1`;
      params.push(adminCtx.storeId);
    }

    query += ` GROUP BY fs.id, s.name, s.slug ORDER BY fs.created_at DESC`;

    const sales = await sql.query(query, params);
    return NextResponse.json(sales);
  } catch (error) {
    console.error('Admin flash sales GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sales' }, { status: 500 });
  }
}

// POST create new flash sale
export async function POST(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      title, subtitle, discount_percent, starts_at, ends_at,
      badge_text, product_ids, is_active, store_id
    } = body;

    if (!title || !ends_at || discount_percent === undefined) {
      return NextResponse.json({ error: 'title, ends_at, and discount_percent are required' }, { status: 400 });
    }

    let targetStoreId = null;
    if (adminCtx.isStoreAdmin) {
      targetStoreId = adminCtx.storeId;
    } else if (adminCtx.isSuperAdmin && store_id) {
      targetStoreId = parseInt(store_id);
    }

    // If activating this sale, deactivate other sales in the same scope
    if (is_active) {
      if (targetStoreId) {
        await sql.query(`UPDATE flash_sales SET is_active = false WHERE store_id = $1`, [targetStoreId]);
      } else {
        await sql.query(`UPDATE flash_sales SET is_active = false WHERE store_id IS NULL`);
      }
    }

    const result = await sql.query(`
      INSERT INTO flash_sales (title, subtitle, discount_percent, starts_at, ends_at, badge_text, is_active, store_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      title,
      subtitle || null,
      parseInt(discount_percent),
      starts_at || new Date().toISOString(),
      ends_at,
      badge_text || 'SALE',
      is_active ?? false,
      targetStoreId,
    ]);

    const sale = result[0];

    // Insert products (enforcing store product ownership if store admin)
    if (product_ids && product_ids.length > 0) {
      for (const item of product_ids) {
        const pid = typeof item === 'object' ? item.product_id : item;
        const customDiscount = typeof item === 'object' ? item.custom_discount_percent : null;

        if (adminCtx.isStoreAdmin) {
          const verify = await sql.query('SELECT id FROM products WHERE id = $1 AND store_id = $2', [pid, adminCtx.storeId]);
          if (!verify.length) continue; // Skip unauthorized product
        }

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

