import { NextResponse } from 'next/server';
import { initializeDatabase, seedDatabase } from '@/lib/schema';
import { requireAdmin } from '@/lib/auth';

// #3 FIX: Seed endpoint is now protected \u2014 admin-only and disabled in production
export async function GET() {
  // Never run in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed endpoint is disabled in production.' },
      { status: 403 }
    );
  }

  // Require admin authentication
  const isAdmin = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initializeDatabase();
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Seed failed. Check server logs.' }, { status: 500 });
  }
}

