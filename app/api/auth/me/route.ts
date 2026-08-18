import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getPrisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    const res = NextResponse.json({ authenticated: false, user: null });
    res.cookies.delete(SESSION_COOKIE_NAME);
    return res;
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
      const res = NextResponse.json({ authenticated: false, user: null });
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch {
    // If database connection is momentarily unavailable, fallback to verified token payload
    return NextResponse.json({
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
    });
  }
}
