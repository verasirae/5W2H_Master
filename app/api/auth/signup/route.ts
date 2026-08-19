import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  hashPassword,
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  normalizeRole,
  normalizeStatus,
} from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, department, jobTitle } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isDatabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Banco de dados PostgreSQL não configurado ou offline. Conecte o banco para cadastrar novos usuários.',
        },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' },
        { status: 400 }
      );
    }

    const isFirstUser = (await prisma.user.count()) === 0;
    const isMasterAdmin = cleanEmail === 'iraeveras@outlook.com.br' || cleanEmail === 'admin@5w2h.local';
    
    // First user or explicit admin email gets active admin, otherwise new users enter as 'pendente'
    const assignedRole = isFirstUser || isMasterAdmin ? 'admin' : 'membro';
    const assignedStatus = isFirstUser || isMasterAdmin ? 'ativo' : 'pendente';

    const passwordHash = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        passwordHash,
        provider: 'local',
        role: assignedRole,
        department: department || null,
        jobTitle: jobTitle || null,
        status: assignedStatus,
        lastLoginAt: new Date(),
      },
    });

    const token = createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: normalizeRole(newUser.role),
      status: normalizeStatus(newUser.status),
      avatarUrl: newUser.avatarUrl,
      department: newUser.department,
      jobTitle: newUser.jobTitle,
      managedDepartments: [],
      managedTeams: [],
      memberDepartments: newUser.department ? [newUser.department] : [],
      memberTeams: [],
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
        role: normalizeRole(newUser.role),
        status: normalizeStatus(newUser.status),
        department: newUser.department,
        jobTitle: newUser.jobTitle,
        provider: newUser.provider,
        managedDepartments: [],
        managedTeams: [],
        memberDepartments: newUser.department ? [newUser.department] : [],
        memberTeams: [],
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
