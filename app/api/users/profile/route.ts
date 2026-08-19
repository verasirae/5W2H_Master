import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME, hashPassword, verifyPassword } from '@/lib/auth/session';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sessão inválida' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        avatarUrl: session.avatarUrl,
        role: session.role || 'admin',
        department: session.department || 'RH/DP',
        jobTitle: 'Gestor de Processos & Rotinas',
        status: 'active',
        provider: 'local',
        createdAt: new Date().toISOString(),
        tasksAssigned: [],
        stats: {
          totalAssigned: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
        },
      },
    });
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
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
        tasksAssigned: {
          orderBy: { deadlineDate: 'asc' },
          take: 20,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    const assigned = user.tasksAssigned || [];
    const today = new Date().toISOString().slice(0, 10);
    const stats = {
      totalAssigned: assigned.length,
      completed: assigned.filter((t) => t.status === 'Concluído').length,
      pending: assigned.filter((t) => t.status === 'Não iniciado' || t.status === 'Em andamento').length,
      overdue: assigned.filter((t) => t.status !== 'Concluído' && t.deadlineDate < today).length,
    };

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        tasksAssigned: assigned.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
        stats,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  const session = verifySessionToken(token);
  if (!session) {
    return NextResponse.json({ success: false, error: 'Sessão inválida' }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        user: {
          id: session.userId,
          email: session.email,
          name: body.name || session.name,
          department: body.department || session.department,
          jobTitle: body.jobTitle || 'Gestor de Processos',
          avatarUrl: body.avatarUrl || session.avatarUrl,
          role: session.role,
        },
      });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.department !== undefined) updateData.department = body.department;
    if (body.jobTitle !== undefined) updateData.jobTitle = body.jobTitle;
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;

    // Password change validation
    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'A nova senha deve conter pelo menos 6 caracteres.' },
          { status: 400 }
        );
      }

      // If user had an existing password, verify current password
      if (user.passwordHash && body.currentPassword) {
        const isCurrentValid = verifyPassword(body.currentPassword, user.passwordHash);
        if (!isCurrentValid) {
          return NextResponse.json(
            { success: false, error: 'A senha atual informada está incorreta.' },
            { status: 400 }
          );
        }
      }

      updateData.passwordHash = hashPassword(body.newPassword);
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
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
