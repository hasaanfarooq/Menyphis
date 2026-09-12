import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Public seller registration is disabled. Brand accounts are provisioned exclusively by platform administrators.' 
    },
    { status: 403 }
  );
}
