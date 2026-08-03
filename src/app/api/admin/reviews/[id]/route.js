import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// PATCH - approve or reject a review
export async function PATCH(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { approved } = body;

    if (typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'approved must be a boolean' }, { status: 400 });
    }

    const result = await sql.query(
      'UPDATE reviews SET approved = $1 WHERE id = $2 RETURNING *',
      [approved, id]
    );

    if (!result.length) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Recalculate product rating after approval change
    const productId = result[0].product_id;
    await sql.query(`
      UPDATE products SET
        rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = $1 AND approved = true), 0),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND approved = true)
      WHERE id = $1
    `, [productId]);

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Admin review PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE a review
export async function DELETE(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Get product_id before deleting
    const review = await sql.query('SELECT product_id FROM reviews WHERE id = $1', [id]);
    if (!review.length) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    const productId = review[0].product_id;

    await sql.query('DELETE FROM reviews WHERE id = $1', [id]);

    // Update product stats
    await sql.query(`
      UPDATE products SET
        rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = $1 AND approved = true), 0),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND approved = true)
      WHERE id = $1
    `, [productId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin review DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
