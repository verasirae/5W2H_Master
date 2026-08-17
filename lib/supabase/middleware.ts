import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '';

  // If Supabase keys are not set up at all, bypass route blocking so app doesn't crash
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-ref')) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: {
      sameSite: 'none',
      secure: true,
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, { ...options, sameSite: 'none', secure: true })
        );
      },
    },
  });

  // IMPORTANT: Avoid using getSession() on the server as it does not validate the JWT with Supabase.
  // getUser() validates the token against Supabase Auth servers.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  if (!user && !isAuthPage && !isPasswordResetPage && !isAuthCallback && !isApiRoute && !isPublicStatic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    if (pathname !== '/' && pathname !== '/login') {
      url.searchParams.set('redirect', pathname);
    }
    const redirectResponse = NextResponse.redirect(url);
    // Propagate all refreshed cookies to redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  // 2. If authenticated and trying to access login/signup/forgot-password -> redirect to destination
  if (user && isAuthPage) {
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
    const redirectResponse = NextResponse.redirect(url);
    // Propagate all refreshed cookies to redirect response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
