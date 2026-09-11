import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';

// GET all products with their featured status and order (Super Admin module)
export async function GET() {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx || !adminCtx.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    // Return all active products, with featured products prioritized first
    const products = await sql.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.price,
        p.image_url,
        p.stock,
        p.featured,
        COALESCE(p.featured_order, 0) as featured_order,
        s.name as store_name,
        s.slug as store_slug,
        c.name as category_name
      FROM products p
      LEFT JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.featured DESC, COALESCE(p.featured_order, 0) ASC, p.created_at DESC
    `);

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json({ error: 'Failed to fetch featured products' }, { status: 500 });
  }
}

// PUT batch update featured products order and status
export async function PUT(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx || !adminCtx.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { items, toggle_id, featured_status } = body;

    // Mode 1: Quick toggle single product
    if (toggle_id !== undefined && featured_status !== undefined) {
      await sql.query(
        `UPDATE products SET featured = $1 WHERE id = $2`,
        [featured_status, parseInt(toggle_id)]
      );
      return NextResponse.json({ success: true, message: 'Product featured status updated' });
    }

    // Mode 2: Reorder batch
    if (Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await sql.query(
          `UPDATE products 
           SET featured = $1, featured_order = $2 
           WHERE id = $3`,
          [item.featured ?? true, item.featured_order !== undefined ? item.featured_order : i, parseInt(item.id)]
        );
      }
      return NextResponse.json({ success: true, message: 'Featured order saved successfully' });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (error) {
    console.error('Error updating featured products:', error);
    return NextResponse.json({ error: 'Failed to update featured products' }, { status: 500 });
  }
}
