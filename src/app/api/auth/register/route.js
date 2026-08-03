import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth';
import { applyRegisterRateLimit } from '@/lib/rateLimiter';

export async function POST(request) {
  // #5 FIX: Rate limit registration \u2014 max 3 accounts per IP per hour
  const rateLimitResponse = await applyRegisterRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Check if registration is open in site settings
    const settingRes = await sql.query("SELECT value FROM site_settings WHERE key = 'registration_open'");
    const rows = Array.isArray(settingRes) ? settingRes : (settingRes.rows || settingRes);
    const isOpen = rows[0]?.value ?? true;
    
    if (!isOpen) {
      return NextResponse.json({ error: 'Registration is currently closed' }, { status: 403 });
    }

    const { name, email, password } = await request.json();

    if (!name || !email || !password || password.length < 8) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await sql.query('SELECT id FROM users WHERE email = $1', [email]);
    const existing = Array.isArray(existingUser) ? existingUser : (existingUser.rows || existingUser);
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const result = await sql.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, is_admin',
      [name, email, passwordHash]
    );
    
    const users = Array.isArray(result) ? result : (result.rows || result);
    const user = users[0];

    // Set cookie
    await setAuthCookie(user);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}

