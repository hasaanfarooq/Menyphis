import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET reviews for a product (productId passed as `slug` param for route consistency)
export async function GET(request, { params }) {
  try {
    const { slug: productId } = await params;
    const session = await getSession();
    const userId = session?.user?.id || null;

    const reviews = await sql.query(`
      SELECT r.id, r.rating, r.title, r.comment, r.created_at,
             u.id as user_id, u.name as user_name, u.avatar_url as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1 AND r.approved = true
      ORDER BY r.created_at DESC
    `, [productId]);

    // Aggregated stats
    const stats = await sql.query(`
      SELECT 
        COUNT(*) as total,
        ROUND(AVG(rating)::numeric, 1) as average,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one
      FROM reviews
      WHERE product_id = $1 AND approved = true
    `, [productId]);

    // For logged-in users: check if they purchased AND if they already reviewed
    let userHasPurchased = false;
    let userHasReviewed = false;

    if (userId) {
      const purchaseCheck = await sql.query(`
        SELECT 1 FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.user_id = $1
          AND oi.product_id = $2
          AND o.status IN ('delivered', 'completed', 'shipped', 'processing', 'pending')
        LIMIT 1
      `, [userId, productId]);
      userHasPurchased = purchaseCheck.length > 0;

      const reviewCheck = await sql.query(
        'SELECT 1 FROM reviews WHERE product_id = $1 AND user_id = $2 LIMIT 1',
        [productId, userId]
      );
      userHasReviewed = reviewCheck.length > 0;
    }

    return NextResponse.json({
      reviews,
      stats: stats[0] || { total: 0, average: 0, five: 0, four: 0, three: 0, two: 0, one: 0 },
      userHasPurchased,
      userHasReviewed,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST a review for a product
export async function POST(request, { params }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'You must be logged in to leave a review' }, { status: 401 });
    }

    const { slug: productId } = await params;
    const body = await request.json();
    const { rating, title, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // ── PURCHASE GATE: user must have ordered this product ──
    const purchaseCheck = await sql.query(`
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = $1
        AND oi.product_id = $2
        AND o.status IN ('delivered', 'completed', 'shipped', 'processing', 'pending')
      LIMIT 1
    `, [session.user.id, productId]);

    if (purchaseCheck.length === 0) {
      return NextResponse.json(
        { error: 'You can only review products you have purchased.' },
        { status: 403 }
      );
    }

    // Check if user already reviewed this product
    const existing = await sql.query(
      'SELECT id FROM reviews WHERE product_id = $1 AND user_id = $2',
      [productId, session.user.id]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
    }

    const result = await sql.query(`
      INSERT INTO reviews (product_id, user_id, rating, title, comment, approved)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, rating, title, comment, created_at
    `, [productId, session.user.id, parseInt(rating), title || null, comment || null]);

    // Update product rating and review_count
    await sql.query(`
      UPDATE products SET
        rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE product_id = $1 AND approved = true),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1 AND approved = true)
      WHERE id = $1
    `, [productId]);

    return NextResponse.json({ ...result[0], user_name: session.user.name }, { status: 201 });
  } catch (error) {
    console.error('Post review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
