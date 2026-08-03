import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// DELETE own review
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug: productId, reviewId } = await params;

    // Only allow deleting own review (unless admin)
    const review = await sql.query(
      'SELECT * FROM reviews WHERE id = $1 AND product_id = $2',
      [reviewId, productId]
    );
    if (!review.length) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (review[0].user_id !== session.user.id && !session.user.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql.query('DELETE FROM reviews WHERE id = $1', [reviewId]);

    // Update product stats
    await sql.query(`
      UPDATE products SET
        rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = $1 AND approved = true), 0),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND approved = true)
      WHERE id = $1
    `, [productId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
