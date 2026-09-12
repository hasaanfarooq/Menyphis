import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

async function resolveProductId(slugOrId) {
  const num = parseInt(slugOrId, 10);
  if (!isNaN(num) && String(num) === String(slugOrId)) {
    return num;
  }
  const rows = await sql.query('SELECT id FROM products WHERE slug = $1 LIMIT 1', [slugOrId]);
  return rows[0]?.id || null;
}

// DELETE own review
export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug, reviewId } = await params;
    const productId = await resolveProductId(slug);
    if (!productId) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

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
