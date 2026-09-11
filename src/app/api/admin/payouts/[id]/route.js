import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx || !adminCtx.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const payoutId = parseInt(id);

    const body = await request.json();
    const { status, transaction_reference, notes } = body;

    const payoutRes = await sql.query('SELECT * FROM payouts WHERE id = $1', [payoutId]);
    if (payoutRes.length === 0) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    const currentPayout = payoutRes[0];

    // If moving to completed, deduct from pending_payout and add to total_paid_out
    if (status === 'completed' && currentPayout.status !== 'completed') {
      await sql.query(`
        UPDATE stores
        SET pending_payout = GREATEST(0, COALESCE(pending_payout, 0) - $1),
            total_paid_out = COALESCE(total_paid_out, 0) + $1
        WHERE id = $2
      `, [currentPayout.amount, currentPayout.store_id]);
    }

    const updateRes = await sql.query(`
      UPDATE payouts
      SET 
        status = COALESCE($1, status),
        transaction_reference = COALESCE($2, transaction_reference),
        notes = COALESCE($3, notes),
        processed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE processed_at END
      WHERE id = $4
      RETURNING *
    `, [status, transaction_reference, notes, payoutId]);

    return NextResponse.json(updateRes[0]);
  } catch (error) {
    console.error('Payout status update error:', error);
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
  }
}
