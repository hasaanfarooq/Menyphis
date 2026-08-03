import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

// #8 FIX: Zod schema reused across product endpoints
const productUpdateSchema = z.object({
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

export async function PUT(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // #8 FIX: Validate the ID is a safe integer, not an arbitrary string
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const body = await request.json();

    // #8 FIX: Validate and parse the body
    const parsed = productUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, price, compare_price, category_id, image_url, stock } = parsed.data;

    const result = await sql.query(
      `UPDATE products 
       SET name=$1, slug=$2, description=$3, price=$4, compare_price=$5, category_id=$6, image_url=$7, stock=$8
       WHERE id=$9 RETURNING *`,
      [name, slug, description ?? null, price, compare_price ?? null, category_id ?? null, image_url, stock, id]
    );

    const products = Array.isArray(result) ? result : (result.rows || result);
    if (products.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(products[0]);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // #8 FIX: Validate the ID
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    await sql.query('DELETE FROM products WHERE id=$1', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

