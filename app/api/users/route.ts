import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      users: [
        {
          id: 'usr-admin-initial',
          email: 'admin@5w2h.local',
          name: 'Administrador 5W2H',
          role: 'admin',
          department: 'RH/DP',
          jobTitle: 'Gerente de Compliance & Rotinas',
          status: 'active',
          provider: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { tasksCreated: 0, tasksAssigned: 0 },
        },
        {
          id: 'usr-irae-veras',
          email: 'iraeveras@outlook.com.br',
          name: 'Irae Veras',
          role: 'admin',
          department: 'RH/DP',
          jobTitle: 'Gestor de Processos',
          status: 'active',
          provider: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { tasksCreated: 0, tasksAssigned: 0 },
        },
        {
          id: 'usr-member-initial',
          email: 'membro@5w2h.local',
          name: 'Membro da Equipe',
          role: 'member',
          department: 'Operações',
          jobTitle: 'Analista de Processos',
          status: 'active',
          provider: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { tasksCreated: 0, tasksAssigned: 0 },
        },
      ],
    });
  }

  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        department: true,
        jobTitle: true,
        status: true,
        provider: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasksCreated: true,
            tasksAssigned: true,
          },
        },
      },
    });

    return NextResponse.json({
      connected: true,
      users: users.map((u) => ({
        ...u,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Falha ao buscar usuários',
        users: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: 'O e-mail é obrigatório.' }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        user: {
          id: `usr-${Date.now()}`,
          email,
          name: body.name || email.split('@')[0],
          role: body.role || 'member',
          department: body.department || null,
          jobTitle: body.jobTitle || null,
          status: body.status || 'active',
          provider: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const prisma = getPrisma();

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Este e-mail já está cadastrado no sistema.' }, { status: 400 });
    }

    const passwordHash = body.password ? hashPassword(body.password) : hashPassword('user123456');

    const newUser = await prisma.user.create({
      data: {
        email,
        name: body.name?.trim() || email.split('@')[0],
        passwordHash,
        role: body.role || 'member',
        department: body.department || null,
        jobTitle: body.jobTitle || null,
        status: body.status || 'active',
        provider: 'local',
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
        role: newUser.role,
        department: newUser.department,
        jobTitle: newUser.jobTitle,
        status: newUser.status,
        provider: newUser.provider,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
