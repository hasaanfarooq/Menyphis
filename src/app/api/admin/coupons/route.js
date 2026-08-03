import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all coupons (admin)
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coupons = await sql.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM coupon_uses cu WHERE cu.coupon_id = c.id)::int as actual_uses
      FROM coupons c
      ORDER BY c.created_at DESC
    `);
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Admin coupons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST create coupon
export async function POST(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      code, description, type, value, min_order_amount,
      max_discount_amount, usage_limit, per_user_limit,
      starts_at, expires_at, is_active, first_order_only
    } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: 'code, type, and value are required' }, { status: 400 });
    }
    if (!['percentage', 'fixed', 'free_shipping'].includes(type)) {
      return NextResponse.json({ error: 'type must be percentage, fixed, or free_shipping' }, { status: 400 });
    }

    const result = await sql.query(`
      INSERT INTO coupons
        (code, description, type, value, min_order_amount, max_discount_amount,
         usage_limit, per_user_limit, starts_at, expires_at, is_active, first_order_only)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
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
