import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/session';

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
          role: 'member',
          department: 'RH/DP',
          status: 'active',
        },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id },
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

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
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

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name?.trim();
    if (body.role !== undefined) updateData.role = body.role;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
    if (body.password && body.password.length >= 6) {
      updateData.passwordHash = hashPassword(body.password);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
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
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...updated,
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
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

    // Disassociate tasks first
    await prisma.task.updateMany({
      where: { assignedUserId: id },
      data: { assignedUserId: null },
    });
    await prisma.task.updateMany({
      where: { createdById: id },
      data: { createdById: null },
    });

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Usuário excluído com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
