import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth';
import { applyLoginRateLimit } from '@/lib/rateLimiter';

export async function POST(request) {
  // #5 FIX: Rate limit login \u2014 max 5 attempts per IP per 15 minutes
  const rateLimitResponse = await applyLoginRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const result = await sql.query(`
      SELECT u.id, u.name, u.email, u.password_hash, u.avatar_url, u.is_admin, u.role, u.store_id,
             s.name as store_name, s.slug as store_slug, s.logo_url as store_logo
      FROM users u
      LEFT JOIN stores s ON u.store_id = s.id
      WHERE u.email = $1
    `, [email]);
    const users = Array.isArray(result) ? result : (result.rows || result);
    
    if (users.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Remove password hash before setting session
    const { password_hash, ...safeUser } = user;

    await setAuthCookie(safeUser);

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

