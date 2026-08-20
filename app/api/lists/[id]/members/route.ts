import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME, normalizeRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, members: [], invites: [] });
  }

  try {
    const prisma = getPrisma();
    const list = await prisma.taskList.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
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
      },
    });

    if (!list) {
      return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      owner: list.owner,
      isOwner: list.ownerId === userId,
      members: list.members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      })),
      invites: list.invites.map((inv) => ({
        ...inv,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Remove member from list
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get('userId');

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;
  const userRole = normalizeRole(session?.role);

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!targetUserId) {
    return NextResponse.json({ success: false, error: 'ID do usuário é obrigatório' }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, message: 'Membro removido localmente' });
  }

  try {
    const prisma = getPrisma();
    const list = await prisma.taskList.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!list) {
      return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
    }

    const isOwner = list.ownerId === userId;
    const isSelfLeaving = targetUserId === userId;

    // Rule: Only the Owner can remove other members, or user can leave themselves
    if (!isOwner && !isSelfLeaving && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas o proprietário da lista tem permissão para remover membros' },
        { status: 403 }
      );
    }

    // Owner cannot be removed from their own list
    if (targetUserId === list.ownerId) {
      return NextResponse.json(
        { success: false, error: 'O proprietário não pode ser removido da lista' },
        { status: 400 }
      );
    }

    await prisma.taskListMember.deleteMany({
      where: {
        listId: id,
        userId: targetUserId,
      },
    });

    return NextResponse.json({ success: true, message: 'Membro removido da lista com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
