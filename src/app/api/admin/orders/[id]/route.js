import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';
import { z } from 'zod';

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  tracking_number: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
});

export async function GET(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Get order details
    const orderResult = await sql.query(`
      SELECT 
        o.*, 
        u.name as user_name, 
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1
    `, [id]);
    
    const orderRows = Array.isArray(orderResult) ? orderResult : (orderResult.rows || orderResult);
    
    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const order = orderRows[0];

    // Get order items with store info
    let itemsQuery = `
      SELECT 
        oi.*,
        p.name as product_name,
        p.image_url as product_image,
        s.name as store_name,
        s.slug as store_slug
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN stores s ON oi.store_id = s.id
      WHERE oi.order_id = $1
    `;
    let queryParams = [id];

    if (adminCtx.isStoreAdmin) {
      itemsQuery += ` AND oi.store_id = $2`;
      queryParams.push(adminCtx.storeId);
    }

    const itemsResult = await sql.query(itemsQuery, queryParams);
    const items = Array.isArray(itemsResult) ? itemsResult : (itemsResult.rows || itemsResult);

    if (adminCtx.isStoreAdmin && items.length === 0) {
      return NextResponse.json({ error: 'Forbidden: No items from your store in this order' }, { status: 403 });
    }

    order.items = items;
    if (adminCtx.isStoreAdmin) {
      order.total = items.reduce((acc, item) => acc + (parseFloat(item.price) * item.quantity), 0);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Fetch order details error:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Check that store admin has items in this order
    if (adminCtx.isStoreAdmin) {
      const items = await sql.query('SELECT id FROM order_items WHERE order_id = $1 AND store_id = $2', [id, adminCtx.storeId]);
      if (!items.length) {
        return NextResponse.json({ error: 'Forbidden: No products from your store in this order' }, { status: 403 });
      }
    }

    const body = await request.json();

    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, tracking_number, carrier } = parsed.data;

    const result = await sql.query(
      `UPDATE orders SET status = $1, tracking_number = $2, carrier = $3 WHERE id = $4 RETURNING *`,
      [status, tracking_number || null, carrier || null, id]
    );

    const updatedOrder = Array.isArray(result) ? result : (result.rows || result);
    
    if (updatedOrder.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(updatedOrder[0]);
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
