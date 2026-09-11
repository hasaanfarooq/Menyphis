import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';

// GET single coupon
export async function GET(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const result = await sql.query('SELECT * FROM coupons WHERE id = $1', [id]);
    if (!result.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const coupon = result[0];
    if (adminCtx.isStoreAdmin && coupon.store_id !== adminCtx.storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch coupon' }, { status: 500 });
  }
}

// PUT update coupon
export async function PUT(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Check existing
    const existing = await sql.query('SELECT * FROM coupons WHERE id = $1', [id]);
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (adminCtx.isStoreAdmin && existing[0].store_id !== adminCtx.storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      code, description, type, value, min_order_amount,
      max_discount_amount, usage_limit, per_user_limit,
      starts_at, expires_at, is_active, first_order_only, store_id
    } = body;

    let targetStoreId = existing[0].store_id;
    if (adminCtx.isSuperAdmin && store_id !== undefined) {
      targetStoreId = store_id ? parseInt(store_id) : null;
    }

    const result = await sql.query(`
      UPDATE coupons SET
        code = $1, description = $2, type = $3, value = $4,
        min_order_amount = $5, max_discount_amount = $6,
        usage_limit = $7, per_user_limit = $8, starts_at = $9,
        expires_at = $10, is_active = $11, first_order_only = $12,
        store_id = $13
      WHERE id = $14
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
      id,
    ]);

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Update coupon error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A coupon with this code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

// DELETE coupon
export async function DELETE(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const existing = await sql.query('SELECT * FROM coupons WHERE id = $1', [id]);
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (adminCtx.isStoreAdmin && existing[0].store_id !== adminCtx.storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql.query('DELETE FROM coupons WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}

