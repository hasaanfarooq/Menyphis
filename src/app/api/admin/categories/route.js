import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, {
    message: 'Slug must only contain lowercase letters, numbers, and hyphens',
  }),
  description: z.string().optional().nullable(),
  image_url: z.string().url().max(2000).optional().nullable(),
  store_id: z.any().optional(),
});

export async function GET(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let query;
    let params = [];

    if (adminCtx.isStoreAdmin) {
      query = `
        SELECT 
          c.*,
          s.name as store_name,
          s.slug as store_slug,
          CAST(COUNT(p.id) AS INTEGER) as product_count,
          (c.store_id = $1) as is_owner
        FROM categories c
        LEFT JOIN stores s ON c.store_id = s.id
        LEFT JOIN products p ON c.id = p.category_id AND (p.store_id = $1 OR c.store_id IS NULL)
        WHERE c.store_id IS NULL OR c.store_id = $1
        GROUP BY c.id, s.name, s.slug
        ORDER BY (c.store_id IS NOT NULL) DESC, c.name ASC
      `;
      params.push(adminCtx.storeId);
    } else {
      query = `
        SELECT 
          c.*,
          s.name as store_name,
          s.slug as store_slug,
          CAST(COUNT(p.id) AS INTEGER) as product_count,
          true as is_owner
        FROM categories c
        LEFT JOIN stores s ON c.store_id = s.id
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id, s.name, s.slug
        ORDER BY (c.store_id IS NOT NULL) DESC, c.id DESC
      `;
    }

    const result = await sql.query(query, params);
    const categories = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Fetch admin categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, image_url, store_id } = parsed.data;

    let targetStoreId = null;
    if (adminCtx.isStoreAdmin) {
      targetStoreId = adminCtx.storeId;
    } else if (adminCtx.isSuperAdmin && store_id) {
      targetStoreId = parseInt(store_id);
    }

    // Check slug collision within the target scope
    let existingCheck;
    if (targetStoreId) {
      existingCheck = await sql.query(
        'SELECT id FROM categories WHERE slug = $1 AND store_id = $2',
        [slug, targetStoreId]
      );
    } else {
      existingCheck = await sql.query(
        'SELECT id FROM categories WHERE slug = $1 AND store_id IS NULL',
        [slug]
      );
    }

    const duplicate = Array.isArray(existingCheck) ? existingCheck : (existingCheck.rows || existingCheck);
    if (duplicate.length > 0) {
      return NextResponse.json({ error: 'A category with this slug already exists in this scope' }, { status: 400 });
    }

    const result = await sql.query(
      `INSERT INTO categories (name, slug, description, image_url, store_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, slug, description ?? null, image_url ?? null, targetStoreId]
    );

    const categories = Array.isArray(result) ? result : (result.rows || result);
    const newCategory = { ...categories[0], product_count: 0, is_owner: true };
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
