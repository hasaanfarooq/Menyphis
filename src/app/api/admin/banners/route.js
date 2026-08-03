import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all banners (admin)
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const banners = await sql.query('SELECT * FROM site_banners ORDER BY placement, id');
    return NextResponse.json(banners);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST create banner
export async function POST(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { placement, title, subtitle, cta_text, cta_link, image_url, bg_color, text_color, is_active, extra_config } = body;
    if (!placement) return NextResponse.json({ error: 'placement required' }, { status: 400 });
    const result = await sql.query(`
      INSERT INTO site_banners (placement, title, subtitle, cta_text, cta_link, image_url, bg_color, text_color, is_active, extra_config)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [placement, title || null, subtitle || null, cta_text || null, cta_link || null,
        image_url || null, bg_color || '#1e293b', text_color || '#ffffff', is_active ?? true,
        JSON.stringify(extra_config || {})]);
    return NextResponse.json(result[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 });
  }
}

// PUT update banner by ID
export async function PUT(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { id, placement, title, subtitle, cta_text, cta_link, image_url, bg_color, text_color, is_active, extra_config } = body;
    const result = await sql.query(`
      UPDATE site_banners SET placement=$1, title=$2, subtitle=$3, cta_text=$4, cta_link=$5,
        image_url=$6, bg_color=$7, text_color=$8, is_active=$9, extra_config=$10
      WHERE id=$11 RETURNING *
    `, [placement, title || null, subtitle || null, cta_text || null, cta_link || null,
        image_url || null, bg_color || '#1e293b', text_color || '#ffffff', is_active ?? true,
        JSON.stringify(extra_config || {}), id]);
    if (!result.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// DELETE banner
export async function DELETE(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    await sql.query('DELETE FROM site_banners WHERE id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
