import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME, normalizeRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;
  const userRole = normalizeRole(session?.role);

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, list: null });
  }

  try {
    const prisma = getPrisma();
    const list = await prisma.taskList.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        group: { select: { id: true, title: true, color: true, ownerId: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true, jobTitle: true } },
          },
          orderBy: { joinedAt: 'asc' },
        },
        invites: {
          where: { status: 'pendente' },
          include: {
            invitee: { select: { id: true, name: true, email: true, avatarUrl: true } },
            inviter: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: {
            assignedUser: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
            createdBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    if (!list) {
      return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
    }

    const isOwner = list.ownerId === userId;
    const isMember = list.members.some((m) => m.userId === userId);

    if (!isOwner && !isMember && userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Você não tem permissão para visualizar esta lista' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      list: {
        ...list,
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
        isOwner,
        tasks: list.tasks.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
        })),
        members: list.members.map((m) => ({
          ...m,
          joinedAt: m.joinedAt.toISOString(),
        })),
        invites: list.invites.map((inv) => ({
          ...inv,
          createdAt: inv.createdAt.toISOString(),
          updatedAt: inv.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;
  const userRole = normalizeRole(session?.role);

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, color } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Nome da lista é obrigatório' }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, message: 'Lista atualizada localmente' });
    }

    const prisma = getPrisma();
    const list = await prisma.taskList.findUnique({ where: { id } });
    if (!list) {
      return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
    }

    if (list.ownerId !== userId && userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas o proprietário pode editar as configurações da lista' }, { status: 403 });
    }

    const updated = await prisma.taskList.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        color: color || list.color,
      },
    });

    return NextResponse.json({
      success: true,
      list: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;
  const userRole = normalizeRole(session?.role);

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, message: 'Lista excluída localmente' });
  }

  try {
    const prisma = getPrisma();
    const list = await prisma.taskList.findUnique({ where: { id } });
    if (!list) {
      return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
    }

    if (list.ownerId !== userId && userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas o proprietário pode excluir esta lista' }, { status: 403 });
    }

    // Unlink tasks before deleting or let cascade handle
    await prisma.task.updateMany({
      where: { listId: id },
      data: { listId: null },
    });

    await prisma.taskList.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Lista excluída com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
