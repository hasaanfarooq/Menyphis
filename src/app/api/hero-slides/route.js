import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Public: get active hero slides
export async function GET() {
  try {
    const slides = await sql.query(
      'SELECT * FROM hero_slides WHERE is_active=true ORDER BY sort_order ASC, id ASC'
    );
    return NextResponse.json(slides);
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}
