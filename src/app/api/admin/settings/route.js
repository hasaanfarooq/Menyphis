import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET all settings (admin only)
export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = await sql.query('SELECT key, value FROM site_settings ORDER BY key');
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return NextResponse.json(settings);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

// POST batch-save settings
export async function POST(request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    for (const [key, value] of Object.entries(body)) {
      await sql.query(`
        INSERT INTO site_settings (key, value, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (key) DO UPDATE
          SET value = $2::jsonb, updated_at = NOW()
      `, [key, JSON.stringify(value)]);
    }

    return NextResponse.json({ success: true, saved: Object.keys(body).length });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
