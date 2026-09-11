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

export async function PUT(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const existingCheck = await sql.query('SELECT * FROM categories WHERE id = $1', [id]);
    const existingRows = Array.isArray(existingCheck) ? existingCheck : (existingCheck.rows || existingCheck);
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    const currentCategory = existingRows[0];

    // Store admin can only edit categories belonging to their store
    if (adminCtx.isStoreAdmin && currentCategory.store_id !== adminCtx.storeId) {
      return NextResponse.json({ error: 'Forbidden: You cannot edit global or other store categories' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, image_url, store_id } = parsed.data;

    let targetStoreId = currentCategory.store_id;
    if (adminCtx.isSuperAdmin && store_id !== undefined) {
      targetStoreId = store_id ? parseInt(store_id) : null;
    }

    // Check slug collision within scope
    let dupCheck;
    if (targetStoreId) {
      dupCheck = await sql.query(
        'SELECT id FROM categories WHERE slug = $1 AND store_id = $2 AND id != $3',
        [slug, targetStoreId, id]
      );
    } else {
      dupCheck = await sql.query(
        'SELECT id FROM categories WHERE slug = $1 AND store_id IS NULL AND id != $2',
        [slug, id]
      );
    }
    const duplicates = Array.isArray(dupCheck) ? dupCheck : (dupCheck.rows || dupCheck);
    if (duplicates.length > 0) {
      return NextResponse.json({ error: 'A category with this slug already exists in this scope' }, { status: 400 });
    }

    const result = await sql.query(
      `UPDATE categories 
       SET name=$1, slug=$2, description=$3, image_url=$4, store_id=$5
       WHERE id=$6 RETURNING *`,
      [name, slug, description ?? null, image_url ?? null, targetStoreId, id]
    );

    const categories = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(categories[0]);
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const existingCheck = await sql.query('SELECT * FROM categories WHERE id = $1', [id]);
    const existingRows = Array.isArray(existingCheck) ? existingCheck : (existingCheck.rows || existingCheck);
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    const currentCategory = existingRows[0];

    // Store admin can only delete their store's custom categories
    if (adminCtx.isStoreAdmin && currentCategory.store_id !== adminCtx.storeId) {
      return NextResponse.json({ error: 'Forbidden: Global platform categories cannot be deleted by store admins' }, { status: 403 });
    }

    // Check constraint: does this category have products?
    let productsQuery = 'SELECT COUNT(id) as count FROM products WHERE category_id = $1';
    let productsParams = [id];

    if (adminCtx.isStoreAdmin) {
      productsQuery += ' AND store_id = $2';
      productsParams.push(adminCtx.storeId);
    }

    const productsCheck = await sql.query(productsQuery, productsParams);
    const productsData = Array.isArray(productsCheck) ? productsCheck : (productsCheck.rows || productsCheck);
    
    if (productsData.length > 0 && parseInt(productsData[0].count) > 0) {
      return NextResponse.json({ 
        error: `Cannot delete this category. It currently contains ${productsData[0].count} product(s). Please delete or reassign those products first.` 
      }, { status: 400 });
    }

    await sql.query('DELETE FROM categories WHERE id=$1', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

