import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

// #8 FIX: Zod schema for product creation/update
const productSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, {
    message: 'Slug must only contain lowercase letters, numbers, and hyphens',
  }),
  description: z.string().max(5000).optional().nullable(),
  price: z.number({ coerce: true }).positive(),
  compare_price: z.number({ coerce: true }).positive().optional().nullable(),
  category_id: z.number({ coerce: true }).int().positive().optional().nullable(),
  image_url: z.string().url().max(2000),
  stock: z.number({ coerce: true }).int().min(0).optional().default(0),
});

export async function POST(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // #8 FIX: Validate and parse the body \u2014 reject invalid/malicious inputs
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, price, compare_price, category_id, image_url, stock } = parsed.data;

    const result = await sql.query(
      `INSERT INTO products (name, slug, description, price, compare_price, category_id, image_url, stock)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, slug, description ?? null, price, compare_price ?? null, category_id ?? null, image_url, stock]
    );

    const products = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(products[0]);
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await sql.query('SELECT * FROM products ORDER BY created_at DESC');
    const products = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Fetch admin products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

