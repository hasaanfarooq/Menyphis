import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Protect /admin UI and /api/admin API routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const session = request.cookies.get('session')?.value;
    
    // Decrypt the session
    const payload = session ? await decrypt(session) : null;
    
    // Check if user is authenticated and is an admin
    if (!payload || !payload.user || !payload.user.is_admin) {
      // If it's an API route, return 401 JSON response
      if (pathname.startsWith('/api/admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // If it's a UI route, redirect to home page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
