import { NextRequest, NextResponse } from 'next/server';
import {
  verifySessionToken,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  normalizeRole,
  normalizeStatus,
} from '@/lib/auth/session';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Não autenticado.' }, { status: 401 });
    }

    const payload = verifySessionToken(token);
    if (!payload || !payload.impersonatedFrom) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma impersonação ativa no momento.' },
        { status: 400 }
      );
    }

    const adminId = payload.impersonatedFrom.userId;

    if (!isDatabaseConfigured()) {
      const restoredToken = createSessionToken({
        userId: adminId,
        email: payload.impersonatedFrom.email,
        name: payload.impersonatedFrom.name,
        role: 'admin',
        status: 'ativo',
        department: 'RH/DP',
        managedDepartments: ['RH/DP'],
        impersonatedFrom: null,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: adminId,
          email: payload.impersonatedFrom.email,
          name: payload.impersonatedFrom.name,
          role: 'admin',
          status: 'ativo',
          department: 'RH/DP',
          impersonatedFrom: null,
        },
      });

      response.cookies.set(SESSION_COOKIE_NAME, restoredToken, SESSION_COOKIE_OPTIONS);
      return response;
    }

    const prisma = getPrisma();
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      include: {
        managedDepartments: { include: { department: true } },
        managedTeams: { include: { team: true } },
        memberDepartments: { include: { department: true } },
        memberTeams: { include: { team: true } },
      },
    });

    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Usuário administrador não encontrado.' }, { status: 404 });
    }

    const managedDepts = Array.from(
      new Set(
        [
          ...(adminUser.managedDepartments?.map((md) => md.department.name) || []),
          adminUser.department ? adminUser.department : null,
        ].filter(Boolean) as string[]
      )
    );

    const memberDepts = Array.from(
      new Set(
        [
          ...(adminUser.memberDepartments?.map((md) => md.department.name) || []),
          adminUser.department ? adminUser.department : null,
        ].filter(Boolean) as string[]
      )
    );

    const restoredToken = createSessionToken({
      userId: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: normalizeRole(adminUser.role),
      status: normalizeStatus(adminUser.status),
      avatarUrl: adminUser.avatarUrl,
      department: adminUser.department,
      jobTitle: adminUser.jobTitle,
      managedDepartments: managedDepts,
      managedTeams: adminUser.managedTeams?.map((mt) => mt.team.name) || [],
      memberDepartments: memberDepts,
      memberTeams: adminUser.memberTeams?.map((mt) => mt.team.name) || [],
      impersonatedFrom: null,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: normalizeRole(adminUser.role),
        status: normalizeStatus(adminUser.status),
        avatarUrl: adminUser.avatarUrl,
        department: adminUser.department,
        jobTitle: adminUser.jobTitle,
        managedDepartments: managedDepts,
        managedTeams: adminUser.managedTeams?.map((mt) => mt.team.name) || [],
        memberDepartments: memberDepts,
        memberTeams: adminUser.memberTeams?.map((mt) => mt.team.name) || [],
        impersonatedFrom: null,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, restoredToken, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Erro ao parar impersonação' }, { status: 500 });
  }
}
