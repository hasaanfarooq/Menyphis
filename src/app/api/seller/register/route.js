import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth';
import { z } from 'zod';

const onboardingSchema = z.object({
  name: z.string().min(2, 'Your name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  store_name: z.string().min(2, 'Store name must be at least 2 characters'),
  store_slug: z.string().min(2, 'Store slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and dashes'),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  bank_account_title: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      store_name,
      store_slug,
      tagline,
      description,
      bank_account_title,
      bank_name,
      bank_account_number,
    } = parsed.data;

    // 1. Check if email already registered
    const existingUser = await sql.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    // 2. Check if store slug already taken
    const existingStore = await sql.query('SELECT id FROM stores WHERE slug = $1', [store_slug.toLowerCase().trim()]);
    if (existingStore.length > 0) {
      return NextResponse.json({ error: 'This store URL/slug is already taken. Please choose another.' }, { status: 400 });
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Create user as store_admin
    const userResult = await sql.query(`
      INSERT INTO users (name, email, password_hash, is_admin, role)
      VALUES ($1, $2, $3, true, 'store_admin')
      RETURNING id, name, email, is_admin, role
    `, [name, email.toLowerCase().trim(), passwordHash]);
    const user = userResult[0];

    // 5. Create store linked to this owner
    const storeResult = await sql.query(`
      INSERT INTO stores (
        name, slug, tagline, description, owner_id, is_active, is_featured, commission_rate,
        bank_account_title, bank_name, bank_account_number
      )
      VALUES ($1, $2, $3, $4, $5, true, false, 10.0, $6, $7, $8)
      RETURNING *
    `, [
      store_name,
      store_slug.toLowerCase().trim(),
      tagline || 'Fresh urban streetwear & culture',
      description || '',
      user.id,
      bank_account_title || null,
      bank_name || null,
      bank_account_number || null,
    ]);
    const store = storeResult[0];

    // 6. Link user's store_id
    await sql.query('UPDATE users SET store_id = $1 WHERE id = $2', [store.id, user.id]);

    // 7. Auto login session cookie
    await setAuthCookie({
      ...user,
      store_id: store.id
    });

    return NextResponse.json({
      success: true,
      user,
      store,
      message: 'Store created successfully! Welcome to the marketplace.'
    }, { status: 201 });
  } catch (error) {
    console.error('Vendor onboarding error:', error);
    return NextResponse.json({ error: 'Failed to complete seller registration' }, { status: 500 });
  }
}
