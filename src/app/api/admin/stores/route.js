import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const storeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  is_featured: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
  commission_rate: z.number().optional().default(10.0),
  bank_account_title: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
  bank_iban: z.string().optional().nullable(),
  // Optional store admin account creation credentials:
  admin_email: z.string().email('Invalid admin email').optional().nullable(),
  admin_password: z.string().min(6, 'Password must be at least 6 characters').optional().nullable(),
  admin_name: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = `
      SELECT 
        s.*,
        u.name as owner_name,
        u.email as owner_email,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count
      FROM stores s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN products p ON s.id = p.store_id
      LEFT JOIN order_items oi ON s.id = oi.store_id
    `;

    // If Store Admin (not super admin), only allow viewing their own store
    if (adminCtx.isStoreAdmin) {
      query += ` WHERE s.id = ${adminCtx.storeId}`;
    }

    query += ` GROUP BY s.id, u.name, u.email ORDER BY s.created_at DESC`;

    const stores = await sql.query(query);
    return NextResponse.json(stores);
  } catch (error) {
    console.error('Error fetching admin stores:', error);
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx || !adminCtx.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = storeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const {
      name,
      slug,
      tagline,
      description,
      logo_url,
      banner_url,
      is_featured,
      is_active,
      commission_rate,
      bank_account_title,
      bank_name,
      bank_account_number,
      bank_iban,
      admin_email,
      admin_password,
      admin_name,
    } = parsed.data;

    // Check slug collision
    const existing = await sql.query('SELECT id FROM stores WHERE slug = $1', [slug]);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'A store with this slug already exists' }, { status: 400 });
    }

    let ownerId = null;

    // If admin credentials are provided, create or link store admin account
    if (admin_email && admin_password) {
      const hash = await bcrypt.hash(admin_password, 12);
      const userRes = await sql.query(`
        INSERT INTO users (name, email, password_hash, is_admin, role)
        VALUES ($1, $2, $3, true, 'store_admin')
        ON CONFLICT (email) DO UPDATE SET 
          is_admin = true, 
          role = 'store_admin', 
          password_hash = EXCLUDED.password_hash
        RETURNING id
      `, [admin_name || `${name} Admin`, admin_email.toLowerCase().trim(), hash]);
      ownerId = userRes[0].id;
    }

    // Insert Store
    const storeRes = await sql.query(`
      INSERT INTO stores (
        name, slug, tagline, description, logo_url, banner_url, owner_id, is_featured, is_active,
        commission_rate, bank_account_title, bank_name, bank_account_number, bank_iban
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      name,
      slug,
      tagline || '',
      description || '',
      logo_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=200&fit=crop',
      banner_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
      ownerId,
      is_featured || false,
      is_active !== undefined ? is_active : true,
      commission_rate !== undefined ? commission_rate : 10.0,
      bank_account_title || null,
      bank_name || null,
      bank_account_number || null,
      bank_iban || null,
    ]);

    const newStore = storeRes[0];

    // Link user's store_id
    if (ownerId) {
      await sql.query('UPDATE users SET store_id = $1 WHERE id = $2', [newStore.id, ownerId]);
    }

    return NextResponse.json(newStore, { status: 201 });
  } catch (error) {
    console.error('Error creating store:', error);
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
  }
}
