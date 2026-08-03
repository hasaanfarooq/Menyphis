import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, {
    message: 'Slug must only contain lowercase letters, numbers, and hyphens',
  }),
  description: z.string().optional().nullable(),
  image_url: z.string().url().max(2000).optional().nullable()
});

export async function PUT(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const body = await request.json();

    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, image_url } = parsed.data;

    // Check if slug exists on another category
    const existingCheck = await sql.query('SELECT id FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
    const duplicate = Array.isArray(existingCheck) ? existingCheck : (existingCheck.rows || existingCheck);
    if (duplicate.length > 0) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }

    const result = await sql.query(
      `UPDATE categories 
       SET name=$1, slug=$2, description=$3, image_url=$4
       WHERE id=$5 RETURNING *`,
      [name, slug, description ?? null, image_url ?? null, id]
    );

    const categories = Array.isArray(result) ? result : (result.rows || result);
    if (categories.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Return with product_count intact if we wanted, but the UI might just need the updated base info.
    // We'll just return the updated category.
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
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Check constraint: does this category have products?
    const productsCheck = await sql.query('SELECT COUNT(id) as count FROM products WHERE category_id = $1', [id]);
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
