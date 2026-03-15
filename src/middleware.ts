import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const middleware = auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isAuthenticated = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/register'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // API auth routes are always public
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // If no auth and trying to access protected route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
