import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME, normalizeRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { userIds, message } = body; // userIds: string[]

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Selecione pelo menos um usuário para convidar' }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Convites enviados localmente com sucesso',
        createdCount: userIds.length,
      });
    }

    const prisma = getPrisma();
    const list = await prisma.taskList.findUnique({
      where: { id },
      include: {
        group: { select: { id: true, title: true } },
        members: true,
      },
    });

    if (!list) {
      return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
    }

    // Rule: Only the Owner can invite users
    if (list.ownerId !== userId && userRole !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Apenas o proprietário da lista pode convidar novos membros' },
        { status: 403 }
      );
    }

    const inviterName = session?.name || session?.email || 'Um usuário';
    const inviterEmail = session?.email || '';

    const createdInvites = [];

    for (const targetUserId of userIds) {
      // Don't invite self
      if (targetUserId === userId) continue;

      // Check if already a member
      const isAlreadyMember = list.members.some((m) => m.userId === targetUserId);
      if (isAlreadyMember) continue;

      // Check if active pending invite already exists
      const existingInvite = await prisma.taskListInvite.findFirst({
        where: {
          listId: id,
          inviteeId: targetUserId,
          status: 'pendente',
        },
      });

      if (existingInvite) {
        createdInvites.push(existingInvite);
        continue;
      }

      // Create invite
      const invite = await prisma.taskListInvite.create({
        data: {
          listId: id,
          inviterId: userId,
          inviteeId: targetUserId,
          status: 'pendente',
          message: message?.trim() || null,
        },
      });

      // Create notification for invitee
      await prisma.notification.create({
        data: {
          userId: targetUserId,
          type: 'list_invite',
          title: `Convite para colaborar: ${list.title}`,
          message: `${inviterName} convidou você para colaborar na lista de tarefas "${list.title}" do grupo "${list.group.title}".`,
          data: {
            inviteId: invite.id,
            listId: list.id,
            listTitle: list.title,
            groupId: list.group.id,
            groupTitle: list.group.title,
            inviterId: userId,
            inviterName,
            inviterEmail,
            message: message?.trim() || null,
          },
        },
      });

      createdInvites.push(invite);
    }

    return NextResponse.json({
      success: true,
      message: `${createdInvites.length} convite(s) enviado(s) com sucesso.`,
      invites: createdInvites,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
