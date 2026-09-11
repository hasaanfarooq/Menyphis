import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';
import { z } from 'zod';

const payoutSchema = z.object({
  store_id: z.number().int().positive(),
  amount: z.number().positive(),
  notes: z.string().optional().nullable(),
  transaction_reference: z.string().optional().nullable(),
});

// GET payouts list
export async function GET(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = `
      SELECT 
        p.*,
        s.name as store_name,
        s.slug as store_slug,
        s.bank_name,
        s.bank_account_number,
        s.bank_account_title,
        s.bank_iban
      FROM payouts p
      JOIN stores s ON p.store_id = s.id
    `;
    const params = [];

    if (adminCtx.isStoreAdmin) {
      query += ` WHERE p.store_id = $1`;
      params.push(adminCtx.storeId);
    }

    query += ` ORDER BY p.created_at DESC`;

    const payouts = await sql.query(query, params);
    return NextResponse.json(payouts);
  } catch (error) {
    console.error('Error fetching payouts:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

// POST create/process a payout (Super Admin or Store Admin payout request)
export async function POST(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = payoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { store_id, amount, notes, transaction_reference } = parsed.data;

    // Check store permission
    if (adminCtx.isStoreAdmin && adminCtx.storeId !== store_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify store has enough pending payout
    const storeRes = await sql.query('SELECT pending_payout, total_paid_out, commission_rate FROM stores WHERE id = $1', [store_id]);
    if (storeRes.length === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const store = storeRes[0];
    const pendingBalance = parseFloat(store.pending_payout || 0);

    if (amount > pendingBalance && !adminCtx.isSuperAdmin) {
      return NextResponse.json({ 
        error: `Requested amount ($${amount}) exceeds pending balance ($${pendingBalance})` 
      }, { status: 400 });
    }

    const isSuperAdminAction = adminCtx.isSuperAdmin;
    const payoutStatus = isSuperAdminAction ? 'completed' : 'pending';

    const insertRes = await sql.query(`
      INSERT INTO payouts (
        store_id, amount, commission_deducted, gross_sales, status, notes, transaction_reference, processed_at
      )
      VALUES ($1, $2, 0, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      store_id,
      amount,
      payoutStatus,
      notes || (isSuperAdminAction ? 'Processed by Super Admin' : 'Requested by Store Owner'),
      transaction_reference || null,
      isSuperAdminAction ? new Date() : null,
    ]);

    // If marked as completed immediately by Super Admin, deduct from pending_payout and add to total_paid_out
    if (isSuperAdminAction) {
      await sql.query(`
        UPDATE stores
        SET pending_payout = GREATEST(0, COALESCE(pending_payout, 0) - $1),
            total_paid_out = COALESCE(total_paid_out, 0) + $1
        WHERE id = $2
      `, [amount, store_id]);
    }

    return NextResponse.json(insertRes[0], { status: 201 });
  } catch (error) {
    console.error('Payout creation error:', error);
    return NextResponse.json({ error: 'Failed to process payout' }, { status: 500 });
  }
}
