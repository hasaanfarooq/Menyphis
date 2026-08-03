import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const slides = await sql.query('SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC');
    return NextResponse.json(slides);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const {
      title, subtitle, badge_text, cta_text, cta_link,
      cta_secondary_text, cta_secondary_link, image_url,
      overlay_color, text_color, text_align, sort_order, is_active
    } = body;
    const result = await sql.query(`
      INSERT INTO hero_slides (title, subtitle, badge_text, cta_text, cta_link,
        cta_secondary_text, cta_secondary_link, image_url, overlay_color,
        text_color, text_align, sort_order, is_active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      title || null, subtitle || null, badge_text || null,
      cta_text || null, cta_link || null,
      cta_secondary_text || null, cta_secondary_link || null,
      image_url || null, overlay_color || 'rgba(0,0,0,0.45)',
      text_color || '#ffffff', text_align || 'left',
      parseInt(sort_order) || 0, is_active ?? true
    ]);
    return NextResponse.json(result[0], { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create slide' }, { status: 500 });
  }
}
