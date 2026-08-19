import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME, applyClearSessionCookie } from '@/lib/auth/session';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { headers: NO_CACHE_HEADERS });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    const res = NextResponse.json({ authenticated: false, user: null }, { headers: NO_CACHE_HEADERS });
    applyClearSessionCookie(res);
    return res;
  }

  // If database is not configured or in client-storage mode, return token payload directly
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: payload.userId,
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.avatarUrl,
          role: payload.role || 'member',
          department: payload.department,
          provider: 'local',
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        department: true,
        jobTitle: true,
        provider: true,
        status: true,
      },
    });

    if (!user || user.status === 'inactive') {
      const res = NextResponse.json({ authenticated: false, user: null }, { headers: NO_CACHE_HEADERS });
      applyClearSessionCookie(res);
      return res;
    }

    return NextResponse.json(
      {
        authenticated: true,
        user,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch {
    // If database query temporarily fails, fallback smoothly to token payload
    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: payload.userId,
          email: payload.email,
          name: payload.name,
          avatarUrl: payload.avatarUrl,
          role: payload.role || 'member',
          department: payload.department,
          provider: 'local',
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  }
}
