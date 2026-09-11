import { NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/schema';

// Self-healing migration endpoint
export async function GET() {
  try {
    await initializeDatabase();
    return NextResponse.json({ success: true, message: 'Database schema successfully updated and synced!' });
  } catch (error) {
    console.error('Database sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
