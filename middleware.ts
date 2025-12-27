//JWT-based authentication middleware for Next.js
//Protects admin routes, user account routes, and checkout process


import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, redirectToLogin } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await getUserFromRequest(request);

  //public auth pages: If logged in, don't let them see Login/Register
  if (pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  //protected routes: Define which paths require a user
  const isProtectedRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/account') || 
    pathname.startsWith('/orders') || 
    pathname.startsWith('/checkout');

  if (isProtectedRoute && !user) {
    return redirectToLogin(request);
  }

  //admin-only specific check for the admin role
  if (pathname.startsWith('/admin') && user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/orders/:path*',
    '/checkout/:path*',
    '/auth/:path*'
  ]
};