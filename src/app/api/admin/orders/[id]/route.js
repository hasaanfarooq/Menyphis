import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  tracking_number: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
});

export async function GET(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    // Get order items
    const itemsResult = await sql.query(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [id]);

    order.items = Array.isArray(itemsResult) ? itemsResult : (itemsResult.rows || itemsResult);

    return NextResponse.json(order);
  } catch (error) {
    console.error('Fetch order details error:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
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
