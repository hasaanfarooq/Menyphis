import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { z } from 'zod';

const trackSchema = z.object({
  order_id: z.string().min(1)
});

export async function POST(request) {
  try {
    const body = await request.json();
    
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const { order_id } = parsed.data;
    const orderIdNum = parseInt(order_id, 10);

    if (isNaN(orderIdNum)) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order details but DO NOT fetch PII like full shipping_address to prevent data leaking
    const orderResult = await sql.query(`
      SELECT 
        id, 
        total, 
        status, 
        tracking_number, 
        carrier, 
        created_at
      FROM orders
      WHERE id = $1
    `, [orderIdNum]);
    
    const orderRows = Array.isArray(orderResult) ? orderResult : (orderResult.rows || orderResult);
    
    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    const order = orderRows[0];

    // Get order items
    const itemsResult = await sql.query(`
      SELECT 
        oi.quantity,
        oi.size,
        oi.color,
        oi.price,
        p.name as product_name,
        p.image_url as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [orderIdNum]);

    order.items = Array.isArray(itemsResult) ? itemsResult : (itemsResult.rows || itemsResult);

    return NextResponse.json(order);
  } catch (error) {
    console.error('Tracking fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tracking details' }, { status: 500 });
  }
}
