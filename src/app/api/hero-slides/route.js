import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { HERO_SLIDES_DATA } from '@/lib/heroSlidesData';

async function seedHeroSlides() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255),
      subtitle TEXT,
      badge_text VARCHAR(100),
      cta_text VARCHAR(100),
      cta_link VARCHAR(255),
      cta_secondary_text VARCHAR(100),
      cta_secondary_link VARCHAR(255),
      image_url TEXT,
      overlay_color VARCHAR(100) DEFAULT 'rgba(0,0,0,0.45)',
      text_color VARCHAR(50) DEFAULT '#ffffff',
      text_align VARCHAR(50) DEFAULT 'left',
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Clear previous placeholder/outdated slides
  await sql.query('DELETE FROM hero_slides');

  // Insert the 10 curated professional slides
  for (const s of HERO_SLIDES_DATA) {
    await sql.query(
      `INSERT INTO hero_slides (
        title, subtitle, badge_text, cta_text, cta_link,
        cta_secondary_text, cta_secondary_link, image_url,
        overlay_color, text_color, text_align, sort_order, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        s.title,
        s.subtitle,
        s.badge_text,
        s.cta_text,
        s.cta_link,
        s.cta_secondary_text,
        s.cta_secondary_link,
        s.image_url,
        s.overlay_color,
        s.text_color,
        s.text_align,
        s.sort_order,
        s.is_active,
      ]
    );
  }
}

// Public: get active hero slides
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reset = searchParams.get('reset') === '1' || searchParams.get('seed') === '1';

    let slides = [];
    if (!reset) {
      try {
        slides = await sql.query(
          'SELECT * FROM hero_slides WHERE is_active=true ORDER BY sort_order ASC, id ASC'
        );
      } catch (tableErr) {
        slides = [];
      }
    }

    // If no slides exist, or if reset requested, or if fewer than 10 slides exist, seed the 10 professional slides
    if (reset || !Array.isArray(slides) || slides.length < 10) {
      await seedHeroSlides();
      slides = await sql.query(
        'SELECT * FROM hero_slides WHERE is_active=true ORDER BY sort_order ASC, id ASC'
      );
    }

    return NextResponse.json(slides);
  } catch (e) {
    console.error('[Hero Slides Error]', e);
    // Return the hardcoded 10 slides as ultra-safe fallback
    return NextResponse.json(HERO_SLIDES_DATA, { status: 200 });
  }
}

// Allow POST to force re-seed 10 professional slides
export async function POST() {
  try {
    await seedHeroSlides();
    const slides = await sql.query(
      'SELECT * FROM hero_slides WHERE is_active=true ORDER BY sort_order ASC, id ASC'
    );
    return NextResponse.json({ success: true, count: slides.length, slides });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
