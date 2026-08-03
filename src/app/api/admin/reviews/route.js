import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all reviews (admin)
export async function GET(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // 'all', 'approved', 'pending'
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = `WHERE 1=1`;
    const params = [];
    let idx = 1;

    if (status === 'approved') {
      whereClause += ` AND r.approved = true`;
    } else if (status === 'pending') {
      whereClause += ` AND r.approved = false`;
    }

    if (search) {
      whereClause += ` AND (u.name ILIKE $${idx} OR p.name ILIKE $${idx} OR r.comment ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }

    const reviews = await sql.query(`
      SELECT 
        r.id, r.rating, r.title, r.comment, r.approved, r.created_at,
        u.id as user_id, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar,
        p.id as product_id, p.name as product_name, p.slug as product_slug, p.image_url as product_image
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, [...params, limit, offset]);

    const countResult = await sql.query(`
      SELECT COUNT(*) as total FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN products p ON r.product_id = p.id
      ${whereClause}
    `, params);

    const total = parseInt(countResult[0]?.total || 0);

    return NextResponse.json({
      reviews,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Admin reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
