import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendOrderConfirmationEmail, sendVendorOrderNotification } from '@/lib/email';
import { z } from 'zod';

const orderSchema = z.object({
  total: z.number().positive(),
  shipping_address: z.string().min(5),
  customer_email: z.string().email().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  coupon_code: z.string().optional().nullable(),
  items: z.array(z.object({
    id: z.number().int(),
    name: z.string().optional().nullable(),
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
    
    // --- Maintenance Mode Check ---
    const maintCheck = await sql.query("SELECT value FROM site_settings WHERE key = 'maintenance_mode'");
    const rawMaint = maintCheck[0]?.value;
    const isMaintenance = rawMaint === true || rawMaint === 'true' || rawMaint === '1' || rawMaint === 1;
    if (isMaintenance && !session?.user?.is_admin && session?.user?.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'The store is currently in maintenance mode. Orders are temporarily paused.' },
        { status: 503 }
      );
    }

    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid order data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { total, shipping_address, items, coupon_code, customer_email, customer_name, customer_phone } = parsed.data;
    const finalCustomerEmail = customer_email || session?.user?.email || null;
    const finalCustomerName = customer_name || session?.user?.name || 'Valued Customer';

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
    // Insert order with customer contact information and discount details
    const orderResult = await sql.query(
      `INSERT INTO orders (user_id, total, shipping_address, customer_email, customer_name, customer_phone, discount_amount, coupon_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING id`,
      [user_id, finalTotal, shipping_address, finalCustomerEmail, finalCustomerName, customer_phone || null, discountAmount || 0, couponId || null]
    );
    
    const orderRows = Array.isArray(orderResult) ? orderResult : (orderResult.rows || orderResult);
    const orderId = orderRows[0].id;

    // Fetch store_id, product name, and image_url for products to associate items with their vendor store and rich email manifests
    const productIds = items.map((i) => i.id);
    const productStores = await sql.query(
      `SELECT id, store_id, name, image_url, images FROM products WHERE id = ANY($1::int[])`,
      [productIds]
    );
    const storeMap = {};
    const titleMap = {};
    const imageMap = {};
    productStores.forEach((p) => {
      storeMap[p.id] = p.store_id;
      titleMap[p.id] = p.name;
      imageMap[p.id] = p.image_url || (Array.isArray(p.images) && p.images[0]) || '';
    });

    const storeIds = [...new Set(Object.values(storeMap).filter(Boolean))];
    const storeDetailsMap = {};
    if (storeIds.length > 0) {
      try {
        const storesRes = await sql.query(
          `SELECT s.id, s.name, u.email as owner_email 
           FROM stores s 
           LEFT JOIN users u ON s.owner_id = u.id 
           WHERE s.id = ANY($1::int[])`,
          [storeIds]
        );
        storesRes.forEach(s => {
          storeDetailsMap[s.id] = { name: s.name, owner_email: s.owner_email };
        });
      } catch (storeErr) {
        console.warn('Could not fetch store owner telemetry:', storeErr);
      }
    }

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

    // --- Trigger Order Confirmation Email via Resend ---
    if (finalCustomerEmail) {
      const emailItems = items.map(item => ({
        ...item,
        name: item.name || titleMap[item.id] || 'Streetwear Apparel',
        image: item.image || item.product_image || imageMap[item.id] || '',
        store_name: storeDetailsMap[storeMap[item.id]]?.name || item.store_name || ''
      }));

      // Fire asynchronously so email sending never delays or blocks checkout completion
      sendOrderConfirmationEmail({
        orderId,
        customerEmail: finalCustomerEmail,
        customerName: finalCustomerName,
        total: finalTotal,
        discountAmount,
        shippingAddress: shipping_address,
        items: emailItems,
      }).catch(err => {
        console.error('Background order email error:', err);
      });
    }

    // --- Dispatch Multi-Tenant Vendor Order Notifications ---
    try {
      const vendorItemsByStore = {};
      items.forEach(item => {
        const sId = storeMap[item.id];
        if (sId) {
          if (!vendorItemsByStore[sId]) vendorItemsByStore[sId] = [];
          vendorItemsByStore[sId].push({
            ...item,
            name: item.name || titleMap[item.id] || 'Streetwear Apparel',
            image: item.image || item.product_image || imageMap[item.id] || '',
          });
        }
      });

      for (const [sIdStr, storeItems] of Object.entries(vendorItemsByStore)) {
        const sId = parseInt(sIdStr);
        const storeMeta = storeDetailsMap[sId];
        if (storeMeta?.owner_email) {
          const storeSubtotal = storeItems.reduce((acc, curr) => acc + (parseFloat(curr.price) * curr.quantity), 0);
          sendVendorOrderNotification({
            vendorEmail: storeMeta.owner_email,
            storeName: storeMeta.name,
            orderId,
            items: storeItems,
            storeTotal: storeSubtotal,
          }).catch(vErr => console.error('Vendor dispatch email failed:', vErr));
        }
      }
    } catch (vGroupErr) {
      console.warn('Vendor notification grouping error:', vGroupErr);
    }

    return NextResponse.json({ success: true, orderId, discountAmount, finalTotal });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process order', details: error.stack }, { status: 500 });
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
      `SELECT id, total, status, tracking_number, carrier, created_at, shipping_address 
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [user_id]
    );
    
    const orders = Array.isArray(result) ? result : (result.rows || result);
    if (orders.length === 0) return NextResponse.json([]);

    const orderIds = orders.map(o => o.id);
    const itemsResult = await sql.query(`
      SELECT 
        oi.id,
        oi.order_id,
        oi.quantity,
        oi.price,
        oi.size,
        oi.color,
        p.id as product_id,
        p.name as product_name,
        p.slug as product_slug,
        p.image_url as product_image,
        s.id as store_id,
        s.name as store_name,
        s.slug as store_slug
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN stores s ON oi.store_id = s.id
      WHERE oi.order_id = ANY($1::int[])
    `, [orderIds]);

    const items = Array.isArray(itemsResult) ? itemsResult : (itemsResult.rows || itemsResult);
    const itemsByOrder = {};
    items.forEach(item => {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    });

    const enrichedOrders = orders.map(o => ({
      ...o,
      items: itemsByOrder[o.id] || []
    }));

    return NextResponse.json(enrichedOrders);
  } catch (error) {
    console.error('Fetch user orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
