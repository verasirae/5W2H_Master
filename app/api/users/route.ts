import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  hashPassword,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  normalizeRole,
  normalizeStatus,
} from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentFilter = searchParams.get('department');
  const roleFilter = searchParams.get('role');
  const statusFilter = searchParams.get('status');

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
          status: 'ativo',
          provider: 'local',
          managedDepartments: ['RH/DP', 'Operações', 'Financeiro', 'TI'],
          memberDepartments: ['RH/DP'],
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
          status: 'ativo',
          provider: 'local',
          managedDepartments: ['RH/DP', 'Operações', 'Financeiro', 'TI'],
          memberDepartments: ['RH/DP'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { tasksCreated: 0, tasksAssigned: 0 },
        },
        {
          id: 'usr-gestor-demo',
          email: 'gestor@5w2h.local',
          name: 'Gestor de Operações',
          role: 'gestor',
          department: 'Operações',
          jobTitle: 'Coordenador Operacional',
          status: 'ativo',
          provider: 'local',
          managedDepartments: ['Operações', 'Logística'],
          memberDepartments: ['Operações'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { tasksCreated: 0, tasksAssigned: 0 },
        },
        {
          id: 'usr-member-initial',
          email: 'membro@5w2h.local',
          name: 'Membro da Equipe',
          role: 'membro',
          department: 'Operações',
          jobTitle: 'Analista de Processos',
          status: 'ativo',
          provider: 'local',
          managedDepartments: [],
          memberDepartments: ['Operações'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _count: { tasksCreated: 0, tasksAssigned: 0 },
        },
      ],
    });
  }

  try {
    const prisma = getPrisma();
    const whereClause: any = {};

    if (roleFilter && roleFilter !== 'all') {
      whereClause.role = normalizeRole(roleFilter);
    }
    if (statusFilter && statusFilter !== 'all') {
      whereClause.status = normalizeStatus(statusFilter);
    }
    if (departmentFilter && departmentFilter !== 'all') {
      whereClause.OR = [
        { department: departmentFilter },
        { memberDepartments: { some: { department: { name: departmentFilter } } } },
        { managedDepartments: { some: { department: { name: departmentFilter } } } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        managedDepartments: { include: { department: true } },
        managedTeams: { include: { team: true } },
        memberDepartments: { include: { department: true } },
        memberTeams: { include: { team: true } },
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
      users: users.map((u) => {
        const managedDepts = Array.from(
          new Set(
            [
              ...(u.managedDepartments?.map((md) => md.department.name) || []),
              u.role === 'gestor' && u.department ? u.department : null,
            ].filter(Boolean) as string[]
          )
        );

        const memberDepts = Array.from(
          new Set(
            [
              ...(u.memberDepartments?.map((md) => md.department.name) || []),
              u.department ? u.department : null,
            ].filter(Boolean) as string[]
          )
        );

        return {
          id: u.id,
          email: u.email,
          name: u.name,
          avatarUrl: u.avatarUrl,
          role: normalizeRole(u.role),
          status: normalizeStatus(u.status),
          department: u.department,
          jobTitle: u.jobTitle,
          provider: u.provider,
          managedDepartments: managedDepts,
          managedTeams: u.managedTeams?.map((mt) => mt.team.name) || [],
          memberDepartments: memberDepts,
          memberTeams: u.memberTeams?.map((mt) => mt.team.name) || [],
          lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
          createdAt: u.createdAt.toISOString(),
          updatedAt: u.updatedAt.toISOString(),
          _count: u._count,
        };
      }),
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

    const role = normalizeRole(body.role || 'membro');
    const status = normalizeStatus(body.status || 'ativo');

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        user: {
          id: `usr-${Date.now()}`,
          email,
          name: body.name || email.split('@')[0],
          role,
          department: body.department || null,
          jobTitle: body.jobTitle || null,
          status,
          provider: 'local',
          managedDepartments: body.managedDepartments || [],
          memberDepartments: body.department ? [body.department] : [],
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
        role,
        department: body.department || null,
        jobTitle: body.jobTitle || null,
        status,
        provider: 'local',
      },
    });

    // Handle department associations
    if (Array.isArray(body.managedDepartments) && body.managedDepartments.length > 0) {
      for (const deptName of body.managedDepartments) {
        if (!deptName) continue;
        const dept = await prisma.department.upsert({
          where: { name: deptName },
          update: {},
          create: { name: deptName },
        });
        await prisma.managerDepartment.upsert({
          where: { userId_departmentId: { userId: newUser.id, departmentId: dept.id } },
          update: {},
          create: { userId: newUser.id, departmentId: dept.id },
        }).catch(() => {});
      }
    }

    if (Array.isArray(body.memberDepartments) && body.memberDepartments.length > 0) {
      for (const deptName of body.memberDepartments) {
        if (!deptName) continue;
        const dept = await prisma.department.upsert({
          where: { name: deptName },
          update: {},
          create: { name: deptName },
        });
        await prisma.memberDepartment.upsert({
          where: { userId_departmentId: { userId: newUser.id, departmentId: dept.id } },
          update: {},
          create: { userId: newUser.id, departmentId: dept.id },
        }).catch(() => {});
      }
    }

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
        managedDepartments: body.managedDepartments || [],
        memberDepartments: body.memberDepartments || (newUser.department ? [newUser.department] : []),
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
