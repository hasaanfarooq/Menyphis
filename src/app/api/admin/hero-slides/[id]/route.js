import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const {
      title, subtitle, badge_text, cta_text, cta_link,
      cta_secondary_text, cta_secondary_link, image_url,
      overlay_color, text_color, text_align, sort_order, is_active
    } = body;
    const result = await sql.query(`
      UPDATE hero_slides SET
        title=$1, subtitle=$2, badge_text=$3, cta_text=$4, cta_link=$5,
        cta_secondary_text=$6, cta_secondary_link=$7, image_url=$8,
        overlay_color=$9, text_color=$10, text_align=$11, sort_order=$12, is_active=$13
      WHERE id=$14 RETURNING *
    `, [
      title || null, subtitle || null, badge_text || null,
      cta_text || null, cta_link || null,
      cta_secondary_text || null, cta_secondary_link || null,
      image_url || null, overlay_color || 'rgba(0,0,0,0.45)',
      text_color || '#ffffff', text_align || 'left',
      parseInt(sort_order) || 0, is_active ?? true, id
    ]);
    if (!result.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await sql.query('DELETE FROM hero_slides WHERE id=$1', [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
