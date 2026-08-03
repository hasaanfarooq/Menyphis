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

export async function GET(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await sql.query(`
      SELECT c.*, CAST(COUNT(p.id) AS INTEGER) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.id DESC
    `);
    
    const categories = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Fetch admin categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, image_url } = parsed.data;

    // Check if slug exists
    const existingCheck = await sql.query('SELECT id FROM categories WHERE slug = $1', [slug]);
    const duplicate = Array.isArray(existingCheck) ? existingCheck : (existingCheck.rows || existingCheck);
    if (duplicate.length > 0) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }

    const result = await sql.query(
      `INSERT INTO categories (name, slug, description, image_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, slug, description ?? null, image_url ?? null]
    );

    const categories = Array.isArray(result) ? result : (result.rows || result);
    
    // Add default product_count of 0 for UI consistency
    const newCategory = { ...categories[0], product_count: 0 };
    return NextResponse.json(newCategory);
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A category with this slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
