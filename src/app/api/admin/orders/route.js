import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';

export async function GET(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeParam = searchParams.get('store_id');

    let query;
    let params = [];

    if (adminCtx.isStoreAdmin) {
      // Return orders containing products from this store, with store-specific subtotal
      query = `
        SELECT 
          o.id, 
          COALESCE(SUM(oi.price * oi.quantity), 0) as total, 
          o.status, 
          o.created_at, 
          o.shipping_address,
          u.name as user_name, 
          u.email as user_email,
          COUNT(oi.id) as store_items_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        INNER JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.store_id = $1
        GROUP BY o.id, o.status, o.created_at, o.shipping_address, u.name, u.email
        ORDER BY o.created_at DESC
      `;
      params.push(adminCtx.storeId);
    } else if (storeParam) {
      query = `
        SELECT 
          o.id, 
          COALESCE(SUM(oi.price * oi.quantity), 0) as total, 
          o.status, 
          o.created_at, 
          o.shipping_address,
          u.name as user_name, 
          u.email as user_email,
          COUNT(oi.id) as store_items_count
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        INNER JOIN order_items oi ON o.id = oi.order_id
        WHERE oi.store_id = $1
        GROUP BY o.id, o.status, o.created_at, o.shipping_address, u.name, u.email
        ORDER BY o.created_at DESC
      `;
      params.push(parseInt(storeParam));
    } else {
      query = `
        SELECT 
          o.id, 
          o.total, 
          o.status, 
          o.created_at, 
          o.shipping_address,
          u.name as user_name, 
          u.email as user_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
      `;
    }

    const result = await sql.query(query, params);
    const orders = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch admin orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
