import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  verifyPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  normalizeRole,
  normalizeStatus,
} from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isDatabaseConfigured()) {
      // In offline/unconfigured database mode, allow demo login for standard accounts
      if (
        cleanEmail === 'admin@5w2h.local' ||
        cleanEmail === 'iraeveras@outlook.com.br' ||
        cleanEmail === 'gestor@5w2h.local' ||
        cleanEmail === 'membro@5w2h.local'
      ) {
        const isIrae = cleanEmail.includes('irae');
        const isGestor = cleanEmail.startsWith('gestor');
        const isMember = cleanEmail.startsWith('membro');
        const role = isIrae || (!isGestor && !isMember) ? 'admin' : isGestor ? 'gestor' : 'membro';
        const department = isGestor ? 'Operações' : isMember ? 'Financeiro' : 'RH/DP';

        const token = createSessionToken({
          userId: isIrae ? 'usr-irae-veras' : isGestor ? 'usr-gestor-demo' : isMember ? 'usr-member-demo' : 'usr-admin-demo',
          email: cleanEmail,
          name: isIrae ? 'Irae Veras' : isGestor ? 'Gestor Operações' : isMember ? 'Membro da Equipe' : 'Administrador 5W2H',
          role,
          status: 'ativo',
          avatarUrl: null,
          department,
          managedDepartments: isGestor ? ['Operações', 'Logística'] : ['RH/DP', 'Operações', 'Financeiro', 'TI'],
          memberDepartments: [department],
        });

        const response = NextResponse.json({
          success: true,
          user: {
            id: isIrae ? 'usr-irae-veras' : isGestor ? 'usr-gestor-demo' : isMember ? 'usr-member-demo' : 'usr-admin-demo',
            email: cleanEmail,
            name: isIrae ? 'Irae Veras' : isGestor ? 'Gestor Operações' : isMember ? 'Membro da Equipe' : 'Administrador 5W2H',
            role,
            status: 'ativo',
            department,
            managedDepartments: isGestor ? ['Operações', 'Logística'] : ['RH/DP', 'Operações', 'Financeiro', 'TI'],
            memberDepartments: [department],
            provider: 'local',
          },
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
        return response;
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Banco de dados PostgreSQL não conectado. Use as contas padrão (admin@5w2h.local, gestor@5w2h.local ou iraeveras@outlook.com.br).',
        },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        managedDepartments: { include: { department: true } },
        managedTeams: { include: { team: true } },
        memberDepartments: { include: { department: true } },
        memberTeams: { include: { team: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado. Verifique seu e-mail ou cadastre-se.' },
        { status: 401 }
      );
    }

    if (user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Senha incorreta. Tente novamente.' },
          { status: 401 }
        );
      }
    } else if (user.provider === 'google') {
      return NextResponse.json(
        {
          success: false,
          error: 'Esta conta foi criada com o Google. Por favor, use o botão "Entrar com Google".',
        },
        { status: 400 }
      );
    }

    if (user.status === 'inativo' || user.status === 'inactive') {
      return NextResponse.json(
        {
          success: false,
          error: 'Sua conta está inativada. Entre em contato com um administrador do sistema.',
        },
        { status: 403 }
      );
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

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

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
      status: normalizeStatus(user.status),
      avatarUrl: user.avatarUrl,
      department: user.department,
      jobTitle: user.jobTitle,
      managedDepartments: managedDepts,
      managedTeams: user.managedTeams?.map((mt) => mt.team.name) || [],
      memberDepartments: memberDepts,
      memberTeams: user.memberTeams?.map((mt) => mt.team.name) || [],
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: normalizeRole(user.role),
        status: normalizeStatus(user.status),
        department: user.department,
        jobTitle: user.jobTitle,
        managedDepartments: managedDepts,
        managedTeams: user.managedTeams?.map((mt) => mt.team.name) || [],
        memberDepartments: memberDepts,
        memberTeams: user.memberTeams?.map((mt) => mt.team.name) || [],
        provider: user.provider,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro no processo de autenticação.' },
      { status: 500 }
    );
  }
}
