import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAdminContext } from '@/lib/auth';
import { z } from 'zod';

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
  store_id: z.number({ coerce: true }).int().positive().optional().nullable(),
  colors: z.array(z.string()).optional().default([]),
  sizes: z.array(z.string()).optional().default([]),
  color_images: z.record(z.string()).optional().default({}),
  features: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  featured_order: z.number({ coerce: true }).int().optional().default(0),
});

export async function POST(request) {
  try {
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, slug, description, price, compare_price, category_id, image_url, stock, colors, sizes, color_images, features, featured, featured_order } = parsed.data;

    // Enforce store_id: If Store Admin, always force their own storeId. If Super Admin, use provided or default to official store
    let targetStoreId = adminCtx.isStoreAdmin ? adminCtx.storeId : (parsed.data.store_id || adminCtx.storeId);
    if (!targetStoreId) {
      const defaultStore = await sql.query('SELECT id FROM stores LIMIT 1');
      targetStoreId = defaultStore[0]?.id || null;
    }

    const result = await sql.query(
      `INSERT INTO products (name, slug, description, price, compare_price, category_id, image_url, stock, store_id, colors, sizes, color_images, features, featured, featured_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        name,
        slug,
        description ?? null,
        price,
        compare_price ?? null,
        category_id ?? null,
        image_url,
        stock,
        targetStoreId,
        colors || [],
        sizes || [],
        JSON.stringify(color_images || {}),
        features || [],
        featured ?? false,
        featured_order ?? 0
      ]
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
    const adminCtx = await getAdminContext();
    if (!adminCtx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const storeParam = searchParams.get('store_id');

    let query = `
      SELECT p.*, s.name as store_name, s.slug as store_slug, c.name as category_name
      FROM products p
      LEFT JOIN stores s ON p.store_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    const params = [];

    // If store admin, strictly restrict to their store
    if (adminCtx.isStoreAdmin) {
      query += ` WHERE p.store_id = $1`;
      params.push(adminCtx.storeId);
    } else if (storeParam) {
      query += ` WHERE p.store_id = $1`;
      params.push(parseInt(storeParam));
    }

    query += ` ORDER BY p.created_at DESC`;

    const result = await sql.query(query, params);
    const products = Array.isArray(result) ? result : (result.rows || result);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Fetch admin products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

