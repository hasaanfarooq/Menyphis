import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';

// GET coupons (admin)
export async function GET() {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let query = `
      SELECT c.*,
        s.name as store_name,
        s.slug as store_slug,
        (SELECT COUNT(*) FROM coupon_uses cu WHERE cu.coupon_id = c.id)::int as actual_uses
      FROM coupons c
      LEFT JOIN stores s ON c.store_id = s.id
    `;
    const params = [];

    if (adminCtx.isStoreAdmin) {
      query += ` WHERE c.store_id = $1`;
      params.push(adminCtx.storeId);
    }

    query += ` ORDER BY c.created_at DESC`;

    const coupons = await sql.query(query, params);
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Admin coupons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST create coupon
export async function POST(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      code, description, type, value, min_order_amount,
      max_discount_amount, usage_limit, per_user_limit,
      starts_at, expires_at, is_active, first_order_only, store_id
    } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: 'code, type, and value are required' }, { status: 400 });
    }
    if (!['percentage', 'fixed', 'free_shipping'].includes(type)) {
      return NextResponse.json({ error: 'type must be percentage, fixed, or free_shipping' }, { status: 400 });
    }

    // Determine target store_id
    let targetStoreId = null;
    if (adminCtx.isStoreAdmin) {
      targetStoreId = adminCtx.storeId;
    } else if (adminCtx.isSuperAdmin && store_id) {
      targetStoreId = parseInt(store_id);
    }

    const result = await sql.query(`
      INSERT INTO coupons
        (code, description, type, value, min_order_amount, max_discount_amount,
         usage_limit, per_user_limit, starts_at, expires_at, is_active, first_order_only, store_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      code.toUpperCase().trim(),
      description || null,
      type,
      parseFloat(value),
      parseFloat(min_order_amount) || 0,
      max_discount_amount ? parseFloat(max_discount_amount) : null,
      usage_limit ? parseInt(usage_limit) : null,
      parseInt(per_user_limit) || 1,
      starts_at || new Date().toISOString(),
      expires_at || null,
      is_active ?? true,
      first_order_only ?? false,
      targetStoreId,
    ]);

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Create coupon error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

