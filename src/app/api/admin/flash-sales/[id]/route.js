import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';

// GET single flash sale with its products
export async function GET(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const sales = await sql.query(`SELECT * FROM flash_sales WHERE id = $1`, [id]);
    if (!sales || sales.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const sale = sales[0];

    if (adminCtx.isStoreAdmin && sale.store_id !== adminCtx.storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const products = await sql.query(`
      SELECT p.id, p.name, p.slug, p.price, p.image_url, p.stock, fsp.custom_discount_percent
      FROM flash_sale_products fsp
      JOIN products p ON p.id = fsp.product_id
      WHERE fsp.flash_sale_id = $1
      ORDER BY fsp.id
    `, [id]);

    return NextResponse.json({ ...sale, products });
  } catch (error) {
    console.error('Get flash sale error:', error);
    return NextResponse.json({ error: 'Failed to fetch flash sale' }, { status: 500 });
  }
}

// PUT update flash sale
export async function PUT(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await sql.query(`SELECT * FROM flash_sales WHERE id = $1`, [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const currentSale = existing[0];

    if (adminCtx.isStoreAdmin && currentSale.store_id !== adminCtx.storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title, subtitle, discount_percent, starts_at, ends_at,
      badge_text, product_ids, is_active, store_id
    } = body;

    if (!title || !ends_at || discount_percent === undefined) {
      return NextResponse.json({ error: 'title, ends_at, and discount_percent are required' }, { status: 400 });
    }

    let targetStoreId = currentSale.store_id;
    if (adminCtx.isSuperAdmin && store_id !== undefined) {
      targetStoreId = store_id ? parseInt(store_id) : null;
    }

    // If activating this sale, deactivate other sales in same scope
    if (is_active) {
      if (targetStoreId) {
        await sql.query(`UPDATE flash_sales SET is_active = false WHERE store_id = $1 AND id != $2`, [targetStoreId, id]);
      } else {
        await sql.query(`UPDATE flash_sales SET is_active = false WHERE store_id IS NULL AND id != $1`, [id]);
      }
    }

    const result = await sql.query(`
      UPDATE flash_sales SET
        title = $1, subtitle = $2, discount_percent = $3, starts_at = $4,
        ends_at = $5, badge_text = $6, is_active = $7, store_id = $8
      WHERE id = $9
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
      id,
    ]);

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Replace products: delete old ones, insert new ones
    await sql.query(`DELETE FROM flash_sale_products WHERE flash_sale_id = $1`, [id]);

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
          [id, pid, customDiscount || null]
        );
      }
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Update flash sale error:', error);
    return NextResponse.json({ error: 'Failed to update flash sale' }, { status: 500 });
  }
}

// DELETE flash sale
export async function DELETE(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await sql.query(`SELECT * FROM flash_sales WHERE id = $1`, [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (adminCtx.isStoreAdmin && existing[0].store_id !== adminCtx.storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql.query(`DELETE FROM flash_sales WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete flash sale error:', error);
    return NextResponse.json({ error: 'Failed to delete flash sale' }, { status: 500 });
  }
}

