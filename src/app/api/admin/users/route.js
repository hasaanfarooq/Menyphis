import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await sql.query('SELECT id, name, email, avatar_url, is_admin, created_at FROM users ORDER BY created_at DESC');
    const users = Array.isArray(result) ? result : (result.rows || result);
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Fetch admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
