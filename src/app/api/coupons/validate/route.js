import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST /api/coupons/validate
// Body: { code, orderTotal }
export async function POST(request) {
  try {
    const session = await getSession();
    const userId = session?.user?.id || null;

    const body = await request.json();
    const { code, orderTotal, items } = body;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    // Fetch coupon with store info
    const coupons = await sql.query(`
      SELECT c.*, s.name as store_name
      FROM coupons c
      LEFT JOIN stores s ON c.store_id = s.id
      WHERE c.code = $1
    `, [code.toUpperCase().trim()]);

    if (!coupons.length) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    const coupon = coupons[0];
    const now = new Date();

    // Active check
    if (!coupon.is_active) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    }

    // Date range check
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({ error: 'This coupon is not yet valid' }, { status: 400 });
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    // Global usage limit
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
    }

    const subtotal = parseFloat(orderTotal) || 0;

    // Minimum order amount
    if (parseFloat(coupon.min_order_amount) > 0 && subtotal < parseFloat(coupon.min_order_amount)) {
      return NextResponse.json({
        error: `Minimum order of $${parseFloat(coupon.min_order_amount).toFixed(2)} required for this coupon`
      }, { status: 400 });
    }

    // Store-specific verification
    let applicableSubtotal = subtotal;
    if (coupon.store_id) {
      if (Array.isArray(items) && items.length > 0) {
        const productIds = items.map(i => i.id || i.product_id).filter(Boolean);
        if (productIds.length > 0) {
          const storeProducts = await sql.query(
            'SELECT id FROM products WHERE id = ANY($1::int[]) AND store_id = $2',
            [productIds, coupon.store_id]
          );
          const storeProductIds = new Set(storeProducts.map(p => p.id));
          const matchingItems = items.filter(i => storeProductIds.has(i.id || i.product_id));
          if (matchingItems.length === 0) {
            return NextResponse.json({
              error: `This coupon is only valid for items sold by "${coupon.store_name || 'this store'}".`
            }, { status: 400 });
          }
          applicableSubtotal = matchingItems.reduce(
            (sum, i) => sum + (parseFloat(i.price) * (parseInt(i.quantity) || 1)),
            0
          );
        }
      }
    }

    // Per-user checks (only for logged-in users)
    if (userId) {
      const userUses = await sql.query(
        'SELECT COUNT(*) as count FROM coupon_uses WHERE coupon_id = $1 AND user_id = $2',
        [coupon.id, userId]
      );
      const useCount = parseInt(userUses[0]?.count || 0);
      if (useCount >= parseInt(coupon.per_user_limit || 1)) {
        return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
      }

      // First order only check
      if (coupon.first_order_only) {
        const prevOrders = await sql.query(
          'SELECT COUNT(*) as count FROM orders WHERE user_id = $1',
          [userId]
        );
        if (parseInt(prevOrders[0]?.count || 0) > 0) {
          return NextResponse.json({ error: 'This coupon is only valid on your first order' }, { status: 400 });
        }
      }
    }

    // Compute discount against applicable subtotal
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = applicableSubtotal * (parseFloat(coupon.value) / 100);
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
      }
    } else if (coupon.type === 'fixed') {
      discountAmount = Math.min(parseFloat(coupon.value), applicableSubtotal);
    } else if (coupon.type === 'free_shipping') {
      discountAmount = 0; // handled as shipping = 0 on frontend
    }

    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalTotal = Math.max(0, subtotal - discountAmount);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        store_id: coupon.store_id,
        store_name: coupon.store_name,
      },
      discountAmount,
      finalTotal,
      freeShipping: coupon.type === 'free_shipping',
    });
  } catch (error) {
    console.error('Coupon validate error:', error);
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}
