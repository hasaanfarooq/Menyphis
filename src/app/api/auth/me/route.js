import { NextResponse } from 'next/server';
import { getSession, setAuthCookie } from '@/lib/auth';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ user: null });
    }

    // Fetch fresh details from DB including orders count, wishlist count, created_at
    const userRes = await sql.query(`
      SELECT u.id, u.name, u.email, u.avatar_url, u.is_admin, u.role, u.store_id, u.created_at,
             s.name as store_name, s.slug as store_slug
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.id = $1
    `, [session.user.id]);

    if (!userRes.length) {
      return NextResponse.json({ user: session.user });
    }

    const dbUser = userRes[0];

    // Compute customer summary stats
    const statsRes = await sql.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders WHERE user_id = $1) as orders_count,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = $1) as total_spent,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = $1) as wishlist_count
    `, [session.user.id]);

    const stats = statsRes[0] || { orders_count: 0, total_spent: 0, wishlist_count: 0 };

    return NextResponse.json({ 
      user: {
        ...dbUser,
        orders_count: parseInt(stats.orders_count || 0),
        total_spent: parseFloat(stats.total_spent || 0),
        wishlist_count: parseInt(stats.wishlist_count || 0),
      } 
    });
  } catch (error) {
    return NextResponse.json({ user: null });
  }
}

export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, current_password, new_password } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // If changing password, verify current password
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }
      if (new_password.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const userRow = await sql.query('SELECT password_hash FROM users WHERE id = $1', [session.user.id]);
      if (!userRow.length) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const match = await bcrypt.compare(current_password, userRow[0].password_hash);
      if (!match) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      const newHash = await bcrypt.hash(new_password, 10);
      await sql.query('UPDATE users SET name = $1, password_hash = $2 WHERE id = $3', [name.trim(), newHash, session.user.id]);
    } else {
      await sql.query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), session.user.id]);
    }

    // Update cookie session with new name
    const updatedUser = {
      ...session.user,
      name: name.trim()
    };
    await setAuthCookie(updatedUser);

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
