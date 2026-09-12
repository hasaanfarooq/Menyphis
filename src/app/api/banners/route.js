import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Public: get active banners by placement
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const placement = searchParams.get('placement');
    let banners;
    if (placement) {
      if (placement === 'popup' || placement === 'popup_modal') {
        banners = await sql.query(
          "SELECT * FROM site_banners WHERE (placement='popup' OR placement='popup_modal') AND is_active=true ORDER BY id DESC LIMIT 1"
        );
      } else {
        banners = await sql.query(
          'SELECT * FROM site_banners WHERE placement=$1 AND is_active=true ORDER BY id DESC LIMIT 1',
          [placement]
        );
      }
    } else {
      banners = await sql.query('SELECT * FROM site_banners WHERE is_active=true ORDER BY placement, id');
    }
    return NextResponse.json(banners);
  } catch (e) {
    return NextResponse.json([], { status: 200 });
  }
}
