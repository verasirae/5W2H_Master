import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { hashPassword, normalizeRole, normalizeStatus } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        user: {
          id,
          email: 'usuario@5w2h.local',
          name: 'Usuário Local',
          role: 'membro',
          department: 'RH/DP',
          status: 'ativo',
          managedDepartments: [],
          memberDepartments: ['RH/DP'],
        },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        managedDepartments: { include: { department: true } },
        managedTeams: { include: { team: true } },
        memberDepartments: { include: { department: true } },
        memberTeams: { include: { team: true } },
        tasksAssigned: {
          orderBy: { deadlineDate: 'asc' },
          take: 10,
        },
        _count: {
          select: { tasksCreated: true, tasksAssigned: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
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

    return NextResponse.json({
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
        provider: user.provider,
        managedDepartments: managedDepts,
        managedTeams: user.managedTeams?.map((mt) => mt.team.name) || [],
        memberDepartments: memberDepts,
        memberTeams: user.memberTeams?.map((mt) => mt.team.name) || [],
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        tasksAssigned: user.tasksAssigned,
        _count: user._count,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, user: { id, ...body } });
    }

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    const effectiveRole = body.role !== undefined ? normalizeRole(body.role) : normalizeRole(existing.role);

    // Validation: 1 Gestor per Department constraint check
    if (effectiveRole === 'gestor' && Array.isArray(body.managedDepartments) && body.managedDepartments.length > 0) {
      for (const deptName of body.managedDepartments) {
        if (!deptName) continue;
        const existingManager = await prisma.managerDepartment.findFirst({
          where: {
            department: { name: deptName },
            userId: { not: id },
          },
          include: { user: true, department: true },
        });

        if (existingManager && existingManager.user) {
          return NextResponse.json(
            {
              success: false,
              error: `O departamento "${deptName}" já possui o gestor "${existingManager.user.name || existingManager.user.email}" vinculado. Um departamento só pode ter um gestor por vez.`,
            },
            { status: 400 }
          );
        }
      }
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name?.trim();
    if (body.role !== undefined) updateData.role = normalizeRole(body.role);
    if (body.department !== undefined) updateData.department = body.department;
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
    if (body.status !== undefined) updateData.status = normalizeStatus(body.status);
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.password && body.password.length >= 6) {
      updateData.passwordHash = hashPassword(body.password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Update managed departments if provided
    if (Array.isArray(body.managedDepartments)) {
      // Clear old and assign new
      await prisma.managerDepartment.deleteMany({ where: { userId: id } });
      if (effectiveRole === 'gestor') {
        for (const deptName of body.managedDepartments) {
          if (!deptName) continue;
          const dept = await prisma.department.upsert({
            where: { name: deptName },
            update: {},
            create: { name: deptName },
          });
          await prisma.managerDepartment.create({
            data: { userId: id, departmentId: dept.id },
          }).catch(() => {});
        }
      }
    }

    // Update member departments if provided
    if (Array.isArray(body.memberDepartments)) {
      await prisma.memberDepartment.deleteMany({ where: { userId: id } });
      for (const deptName of body.memberDepartments) {
        if (!deptName) continue;
        const dept = await prisma.department.upsert({
          where: { name: deptName },
          update: {},
          create: { name: deptName },
        });
        await prisma.memberDepartment.create({
          data: { userId: id, departmentId: dept.id },
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...updated,
        role: normalizeRole(updated.role),
        status: normalizeStatus(updated.status),
        managedDepartments: body.managedDepartments || [],
        memberDepartments: body.memberDepartments || [],
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, message: 'Usuário removido' });
    }

    const prisma = getPrisma();
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Usuário removido com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
