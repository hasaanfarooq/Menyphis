import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updateStoreSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Invalid slug format').optional(),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  banner_url: z.string().optional().nullable(),
  rating: z.number({ coerce: true }).min(1).max(5).optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
  commission_rate: z.number({ coerce: true }).optional(),
  bank_account_title: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_account_number: z.string().optional().nullable(),
  bank_iban: z.string().optional().nullable(),
  admin_name: z.string().optional().nullable(),
  admin_email: z.string().email().optional().nullable(),
  admin_password: z.string().min(6).optional().nullable(),
});

export async function PUT(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const storeId = parseInt(id);

    // Check authorization: Must be Super Admin OR the Store Admin of this specific store
    if (!adminCtx.isSuperAdmin && adminCtx.storeId !== storeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateStoreSchema.safeParse(body);
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
      rating, 
      is_featured, 
      is_active,
      commission_rate,
      bank_account_title,
      bank_name,
      bank_account_number,
      bank_iban,
      admin_name,
      admin_email,
      admin_password
    } = parsed.data;

    // Fetch existing store
    const existing = await sql.query('SELECT * FROM stores WHERE id = $1', [storeId]);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    const current = existing[0];

    // Check slug collision if slug changed
    if (slug && slug !== current.slug) {
      const slugCheck = await sql.query('SELECT id FROM stores WHERE slug = $1 AND id != $2', [slug, storeId]);
      if (slugCheck.length > 0) {
        return NextResponse.json({ error: 'A store with this slug already exists' }, { status: 400 });
      }
    }

    // Store Admins cannot change is_featured, is_active, rating, or slug unless Super Admin
    const updatedSlug = adminCtx.isSuperAdmin && slug !== undefined ? slug : current.slug;
    const updatedFeatured = adminCtx.isSuperAdmin && is_featured !== undefined ? is_featured : current.is_featured;
    const updatedActive = adminCtx.isSuperAdmin && is_active !== undefined ? is_active : current.is_active;
    const updatedRating = adminCtx.isSuperAdmin && rating !== undefined ? rating : current.rating;
    const updatedCommission = adminCtx.isSuperAdmin && commission_rate !== undefined ? commission_rate : current.commission_rate;

    // Update Store Admin credentials if requested by Super Admin
    let currentOwnerId = current.owner_id;
    if (adminCtx.isSuperAdmin && (admin_email || admin_password || admin_name)) {
      if (currentOwnerId) {
        let updateQuery = 'UPDATE users SET ';
        const updateParams = [];
        let pIdx = 1;

        if (admin_name) {
          updateQuery += `name = $${pIdx++}, `;
          updateParams.push(admin_name);
        }
        if (admin_email) {
          updateQuery += `email = $${pIdx++}, `;
          updateParams.push(admin_email.toLowerCase().trim());
        }
        if (admin_password) {
          const hash = await bcrypt.hash(admin_password, 12);
          updateQuery += `password_hash = $${pIdx++}, `;
          updateParams.push(hash);
        }

        updateQuery += `is_admin = true, role = 'store_admin', store_id = $${pIdx++} WHERE id = $${pIdx++}`;
        updateParams.push(storeId, currentOwnerId);

        await sql.query(updateQuery, updateParams);
      } else if (admin_email && admin_password) {
        const hash = await bcrypt.hash(admin_password, 12);
        const newUser = await sql.query(`
          INSERT INTO users (name, email, password_hash, is_admin, role, store_id)
          VALUES ($1, $2, $3, true, 'store_admin', $4)
          ON CONFLICT (email) DO UPDATE SET 
            is_admin = true, 
            role = 'store_admin', 
            store_id = $4,
            password_hash = EXCLUDED.password_hash
          RETURNING id
        `, [admin_name || `${name || current.name} Admin`, admin_email.toLowerCase().trim(), hash, storeId]);
        currentOwnerId = newUser[0].id;
      }
    }

    const result = await sql.query(`
      UPDATE stores
      SET 
        name = $1,
        slug = $2,
        tagline = $3,
        description = $4,
        logo_url = $5,
        banner_url = $6,
        rating = $7,
        is_featured = $8,
        is_active = $9,
        commission_rate = $10,
        bank_account_title = $11,
        bank_name = $12,
        bank_account_number = $13,
        bank_iban = $14,
        owner_id = $15
      WHERE id = $16
      RETURNING *
    `, [
      name !== undefined ? name : current.name,
      updatedSlug,
      tagline !== undefined ? tagline : current.tagline,
      description !== undefined ? description : current.description,
      logo_url !== undefined ? logo_url : current.logo_url,
      banner_url !== undefined ? banner_url : current.banner_url,
      updatedRating,
      updatedFeatured,
      updatedActive,
      updatedCommission !== undefined ? updatedCommission : 10.0,
      bank_account_title !== undefined ? bank_account_title : current.bank_account_title,
      bank_name !== undefined ? bank_name : current.bank_name,
      bank_account_number !== undefined ? bank_account_number : current.bank_account_number,
      bank_iban !== undefined ? bank_iban : current.bank_iban,
      currentOwnerId,
      storeId
    ]);

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating store:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx || !adminCtx.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const storeId = parseInt(id);

    await sql.query('DELETE FROM stores WHERE id = $1', [storeId]);
    return NextResponse.json({ success: true, message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error deleting store:', error);
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 });
  }
}
