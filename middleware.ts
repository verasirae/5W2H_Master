import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/cadastro' ||
    pathname === '/forgot-password';

  const isPasswordResetPage = pathname === '/reset-password';
  const isAuthCallback = pathname.startsWith('/auth/');
  const isApiRoute = pathname.startsWith('/api/');
  const isPublicStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.');

  // 1. If not authenticated and trying to access protected pages -> redirect to /login
  if (!token && !isAuthPage && !isPasswordResetPage && !isAuthCallback && !isApiRoute && !isPublicStatic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/' && pathname !== '/login') {
      url.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(url);
  }

  // 2. If authenticated and trying to access login/signup -> redirect to destination
  if (token && isAuthPage) {
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    const targetUrl =
      redirectParam &&
      redirectParam.startsWith('/') &&
      redirectParam !== '/login' &&
      redirectParam !== '/signup' &&
      redirectParam !== '/cadastro' &&
      redirectParam !== '/forgot-password'
        ? redirectParam
        : '/';
    const url = request.nextUrl.clone();
    url.pathname = targetUrl;
    url.searchParams.delete('redirect');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
