// frontend/middleware.ts
// Protects all /admin/* routes — redirects to login if no session

import { NextRequest, NextResponse } from 'next/server';

// Public routes — no auth required
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-otp',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow buyer and supplier portals (have their own auth)
  if (pathname.startsWith('/buyer') || pathname.startsWith('/supplier')) {
    return NextResponse.next();
  }

  // Allow API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Root redirect to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // For admin routes — check refresh token in cookie
  // The actual access token is kept in memory on the client
  // If no refresh token cookie exists, redirect to login
  const refreshToken = request.cookies.get('_refresh_token');
  if (!refreshToken && pathname.startsWith('/admin')) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
