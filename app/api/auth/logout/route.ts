import { NextRequest, NextResponse } from 'next/server';
import { applyClearSessionCookie } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(req: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: 'Desconectado com sucesso' },
    { status: 200, headers: NO_CACHE_HEADERS }
  );

  applyClearSessionCookie(response);
  return response;
}

export async function GET(req: NextRequest) {
  const url = new URL('/login', req.url);
  const response = NextResponse.redirect(url, {
    status: 307,
    headers: NO_CACHE_HEADERS,
  });

  applyClearSessionCookie(response);
  return response;
}
