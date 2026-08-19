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
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Sessão inválida.' }, { status: 401 });
    }

    // Determine actual original admin user
    const originalRole = payload.impersonatedFrom ? payload.impersonatedFrom.role : payload.role;
    if (normalizeRole(originalRole) !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas administradores podem impersonar outros usuários.' },
        { status: 403 }
      );
    }

    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'ID do usuário alvo não informado.' }, { status: 400 });
    }

    const originalAdminInfo = payload.impersonatedFrom || {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: 'admin',
    };

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Banco de dados PostgreSQL não conectado.' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        managedDepartments: { include: { department: true } },
        managedTeams: { include: { team: true } },
        memberDepartments: { include: { department: true } },
        memberTeams: { include: { team: true } },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'Usuário alvo não encontrado.' }, { status: 404 });
    }

    const managedDepts = Array.from(
      new Set(
        [
          ...(targetUser.managedDepartments?.map((md) => md.department.name) || []),
          targetUser.role === 'gestor' && targetUser.department ? targetUser.department : null,
        ].filter(Boolean) as string[]
      )
    );

    const memberDepts = Array.from(
      new Set(
        [
          ...(targetUser.memberDepartments?.map((md) => md.department.name) || []),
          targetUser.department ? targetUser.department : null,
        ].filter(Boolean) as string[]
      )
    );

    const newToken = createSessionToken({
      userId: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: normalizeRole(targetUser.role),
      status: normalizeStatus(targetUser.status),
      avatarUrl: targetUser.avatarUrl,
      department: targetUser.department,
      jobTitle: targetUser.jobTitle,
      managedDepartments: managedDepts,
      managedTeams: targetUser.managedTeams?.map((mt) => mt.team.name) || [],
      memberDepartments: memberDepts,
      memberTeams: targetUser.memberTeams?.map((mt) => mt.team.name) || [],
      impersonatedFrom: originalAdminInfo,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: normalizeRole(targetUser.role),
        status: normalizeStatus(targetUser.status),
        avatarUrl: targetUser.avatarUrl,
        department: targetUser.department,
        jobTitle: targetUser.jobTitle,
        managedDepartments: managedDepts,
        managedTeams: targetUser.managedTeams?.map((mt) => mt.team.name) || [],
        memberDepartments: memberDepts,
        memberTeams: targetUser.memberTeams?.map((mt) => mt.team.name) || [],
        impersonatedFrom: originalAdminInfo,
      },
      message: `Impersonando ${targetUser.name || targetUser.email}`,
    });

    response.cookies.set(SESSION_COOKIE_NAME, newToken, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Erro ao impersonar' }, { status: 500 });
  }
}
