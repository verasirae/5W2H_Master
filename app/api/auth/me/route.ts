import { NextRequest, NextResponse } from 'next/server';
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
  applyClearSessionCookie,
  normalizeRole,
  normalizeStatus,
} from '@/lib/auth/session';
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
          role: normalizeRole(payload.role),
          status: normalizeStatus(payload.status),
          department: payload.department || 'RH/DP',
          jobTitle: payload.jobTitle || 'Gestor 5W2H',
          managedDepartments: payload.managedDepartments || ['RH/DP'],
          managedTeams: payload.managedTeams || [],
          memberDepartments: payload.memberDepartments || ['RH/DP'],
          memberTeams: payload.memberTeams || [],
          impersonatedFrom: payload.impersonatedFrom || null,
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
      include: {
        managedDepartments: {
          include: { department: true },
        },
        managedTeams: {
          include: { team: true },
        },
        memberDepartments: {
          include: { department: true },
        },
        memberTeams: {
          include: { team: true },
        },
      },
    });

    if (!user || user.status === 'inativo' || user.status === 'inactive') {
      const res = NextResponse.json({ authenticated: false, user: null }, { headers: NO_CACHE_HEADERS });
      applyClearSessionCookie(res);
      return res;
    }

    const managedDepts = Array.from(
      new Set(
        [
          ...(user.managedDepartments?.map((md) => md.department.name) || []),
          user.role === 'gestor' && user.department ? user.department : null,
        ].filter(Boolean) as string[]
      )
    );

    const memberDepts = Array.from(
      new Set(
        [
          ...(user.memberDepartments?.map((md) => md.department.name) || []),
          user.department ? user.department : null,
        ].filter(Boolean) as string[]
      )
    );

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          role: normalizeRole(user.role),
          status: normalizeStatus(user.status),
          department: user.department,
          jobTitle: user.jobTitle,
          provider: user.provider,
          managedDepartments: managedDepts,
          managedTeams: user.managedTeams?.map((mt) => mt.team.name) || [],
          memberDepartments: memberDepts,
          memberTeams: user.memberTeams?.map((mt) => mt.team.name) || [],
          impersonatedFrom: payload.impersonatedFrom || null,
        },
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
          role: normalizeRole(payload.role),
          status: normalizeStatus(payload.status),
          department: payload.department,
          jobTitle: payload.jobTitle,
          managedDepartments: payload.managedDepartments || [],
          managedTeams: payload.managedTeams || [],
          memberDepartments: payload.memberDepartments || [],
          memberTeams: payload.memberTeams || [],
          impersonatedFrom: payload.impersonatedFrom || null,
          provider: 'local',
        },
      },
      { headers: NO_CACHE_HEADERS }
    );
  }
}
