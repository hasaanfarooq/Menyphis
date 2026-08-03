import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await sql.query(`
      SELECT 
        o.id, 
        o.total, 
        o.status, 
        o.created_at, 
        u.name as user_name, 
        u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    
    const orders = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch admin orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
