import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const { id } = await params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 });
    }

    // Fetch order details
    const orderRows = await sql.query(
      `SELECT id, user_id, status, total, customer_email FROM orders WHERE id = $1 LIMIT 1`,
      [orderId]
    );
    const order = orderRows[0];

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify ownership: must be the user who placed it, or an authorized admin
    const isOwner = order.user_id === session.user.id;
    const isAdmin = session.user.is_admin || session.user.role === 'super_admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden. You cannot cancel this order.' }, { status: 403 });
    }

    // Strictly enforce cancellation only for pending orders
    if (order.status?.toLowerCase() !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel an order that is already ${order.status}. Contact customer support for assistance.` },
        { status: 400 }
      );
    }

    // 1. Fetch line items for inventory and payout rollbacks
    const items = await sql.query(
      `SELECT product_id, store_id, quantity, price FROM order_items WHERE order_id = $1`,
      [orderId]
    );

    // 2. Restore inventory & decrement total_sold for each product
    for (const item of items) {
      if (item.product_id) {
        await sql.query(
          `UPDATE products 
           SET stock = COALESCE(stock, 0) + $1,
               total_sold = GREATEST(0, COALESCE(total_sold, 0) - $1)
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    // 3. Roll back pending payouts from store balances
    const storeItemGroups = {};
    items.forEach((item) => {
      if (item.store_id) {
        if (!storeItemGroups[item.store_id]) storeItemGroups[item.store_id] = 0;
        storeItemGroups[item.store_id] += parseFloat(item.price) * item.quantity;
      }
    });

    for (const [storeIdStr, grossAmount] of Object.entries(storeItemGroups)) {
      const sId = parseInt(storeIdStr, 10);
      const storeRes = await sql.query('SELECT commission_rate FROM stores WHERE id = $1', [sId]);
      const commissionRate = storeRes[0]?.commission_rate ? parseFloat(storeRes[0].commission_rate) : 10.0;
      const commissionAmount = (grossAmount * commissionRate) / 100;
      const netVendorEarnings = Math.max(0, grossAmount - commissionAmount);

      await sql.query(
        `UPDATE stores 
         SET pending_payout = GREATEST(0, COALESCE(pending_payout, 0) - $1) 
         WHERE id = $2`,
        [netVendorEarnings, sId]
      );
    }

    // 4. Update order status to 'cancelled'
    await sql.query(
      `UPDATE orders SET status = 'cancelled' WHERE id = $1`,
      [orderId]
    );

    return NextResponse.json({
      success: true,
      message: `Order #${orderId} has been successfully cancelled and items were returned to inventory.`,
      orderId,
      status: 'cancelled',
    });
  } catch (error) {
    console.error('[Order Cancel Error]', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
