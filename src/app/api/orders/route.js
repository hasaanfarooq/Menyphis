import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const orderSchema = z.object({
  total: z.number().positive(),
  shipping_address: z.string().min(5),
  coupon_code: z.string().optional().nullable(),
  items: z.array(z.object({
    id: z.number().int(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
    size: z.string().optional().nullable(),
    color: z.string().optional().nullable()
  })).min(1)
});

export async function POST(request) {
  try {
    const session = await getSession();
    const user_id = session?.user?.id || null; // Allow guest checkout

    const body = await request.json();
    
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { total, shipping_address, items, coupon_code } = parsed.data;

    // --- Coupon handling ---
    let discountAmount = 0;
    let couponId = null;
    let finalTotal = total;

    if (coupon_code) {
      const coupon = await sql.query(
        'SELECT * FROM coupons WHERE code = $1 AND is_active = true',
        [coupon_code.toUpperCase().trim()]
      );
      if (coupon.length > 0) {
        const c = coupon[0];
        const now = new Date();
        const notExpired = !c.expires_at || new Date(c.expires_at) > now;
        const notStarted = c.starts_at && new Date(c.starts_at) > now;
        const underLimit = c.usage_limit === null || c.used_count < c.usage_limit;

        if (notExpired && !notStarted && underLimit) {
          if (c.type === 'percentage') {
            discountAmount = total * (parseFloat(c.value) / 100);
            if (c.max_discount_amount) discountAmount = Math.min(discountAmount, parseFloat(c.max_discount_amount));
          } else if (c.type === 'fixed') {
            discountAmount = Math.min(parseFloat(c.value), total);
          }
          discountAmount = Math.round(discountAmount * 100) / 100;
          finalTotal = Math.max(0, total - discountAmount);
          couponId = c.id;
        }
      }
    }

    // Use a transaction conceptually, or just insert sequentially since neon allows multiple queries
    // Insert order
    const orderResult = await sql.query(
      `INSERT INTO orders (user_id, total, shipping_address, status) 
       VALUES ($1, $2, $3, 'pending') RETURNING id`,
      [user_id, finalTotal, shipping_address]
    );
    
    const orderRows = Array.isArray(orderResult) ? orderResult : (orderResult.rows || orderResult);
    const orderId = orderRows[0].id;

    // Fetch store_id for products to associate items with their vendor store
    const productIds = items.map((i) => i.id);
    const productStores = await sql.query(
      `SELECT id, store_id FROM products WHERE id = ANY($1::int[])`,
      [productIds]
    );
    const storeMap = {};
    productStores.forEach((p) => {
      storeMap[p.id] = p.store_id;
    });

    // Insert order items with store_id
    let values = [];
    let placeholders = [];
    let paramIndex = 1;

    items.forEach((item) => {
      placeholders.push(
        `($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`
      );
      values.push(
        orderId,
        item.id,
        storeMap[item.id] || null,
        item.quantity,
        item.size || null,
        item.color || null,
        item.price
      );
    });

    const query = `
      INSERT INTO order_items (order_id, product_id, store_id, quantity, size, color, price)
      VALUES ${placeholders.join(', ')}
    `;

    await sql.query(query, values);

    // --- 1. Real Inventory & Sold Count Updates ---
    // Deduct stock (cannot go below 0) and increment total_sold
    for (const item of items) {
      await sql.query(
        `UPDATE products 
         SET stock = GREATEST(0, COALESCE(stock, 0) - $1),
             total_sold = COALESCE(total_sold, 0) + $1
         WHERE id = $2`,
        [item.quantity, item.id]
      );
    }

    // --- 2. Multi-Tenant Vendor Commission & Payout Accrual ---
    // Calculate each store's earnings minus platform commission
    const storeItemGroups = {};
    items.forEach(item => {
      const sId = storeMap[item.id];
      if (sId) {
        if (!storeItemGroups[sId]) storeItemGroups[sId] = 0;
        storeItemGroups[sId] += parseFloat(item.price) * item.quantity;
      }
    });

    for (const [storeIdStr, grossAmount] of Object.entries(storeItemGroups)) {
      const sId = parseInt(storeIdStr);
      // Fetch store's custom commission rate (defaults to 10%)
      const storeRes = await sql.query('SELECT commission_rate FROM stores WHERE id = $1', [sId]);
      const commissionRate = storeRes[0]?.commission_rate ? parseFloat(storeRes[0].commission_rate) : 10.0;
      const commissionAmount = (grossAmount * commissionRate) / 100;
      const netVendorEarnings = Math.max(0, grossAmount - commissionAmount);

      await sql.query(
        `UPDATE stores 
         SET pending_payout = COALESCE(pending_payout, 0) + $1 
         WHERE id = $2`,
        [netVendorEarnings, sId]
      );
    }

    // --- Record coupon use and increment count ---
    if (couponId) {
      await sql.query(
        `INSERT INTO coupon_uses (coupon_id, user_id, order_id, discount_amount) VALUES ($1, $2, $3, $4)`,
        [couponId, user_id, orderId, discountAmount]
      );
      await sql.query(
        `UPDATE coupons SET used_count = used_count + 1 WHERE id = $1`,
        [couponId]
      );
    }

    return NextResponse.json({ success: true, orderId, discountAmount, finalTotal });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to process order' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getSession();
    const user_id = session?.user?.id;
    
    if (!user_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await sql.query(
      `SELECT id, total, status, created_at, shipping_address 
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user_id]
    );
    
    const orders = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch user orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
