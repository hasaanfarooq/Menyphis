import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch wishlist items with product details
    const result = await sql.query(`
      SELECT p.*
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [userId]);

    const items = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { product_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Check if it's already in the wishlist
    const checkResult = await sql.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [userId, product_id]
    );
    const exists = Array.isArray(checkResult) ? checkResult.length > 0 : (checkResult.rows && checkResult.rows.length > 0) || checkResult.length > 0;

    if (exists) {
      // Remove from wishlist
      await sql.query(
        'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
        [userId, product_id]
      );
      return NextResponse.json({ message: 'Removed from wishlist', action: 'removed' });
    } else {
      // Add to wishlist
      await sql.query(
        'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)',
        [userId, product_id]
      );
      return NextResponse.json({ message: 'Added to wishlist', action: 'added' });
    }
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 });
  }
}
