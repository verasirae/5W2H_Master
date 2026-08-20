import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body; // 'accept' | 'reject' (or status: 'aceito' | 'recusado')

    const newStatus = action === 'accept' || action === 'aceito' ? 'aceito' : 'recusado';

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: newStatus === 'aceito' ? 'Convite aceito localmente' : 'Convite recusado localmente',
        status: newStatus,
      });
    }

    const prisma = getPrisma();
    const invite = await prisma.taskListInvite.findUnique({
      where: { id },
      include: {
        list: {
          include: {
            group: true,
          },
        },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ success: false, error: 'Convite não encontrado' }, { status: 404 });
    }

    // Only the invited user can accept or reject
    if (invite.inviteeId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Apenas o usuário convidado pode responder a este convite' },
        { status: 403 }
      );
    }

    // 1. Update invite status
    const updatedInvite = await prisma.taskListInvite.update({
      where: { id },
      data: { status: newStatus },
    });

    // 2. If accepted, add user to TaskListMember (Referência Compartilhada em Tempo Real)
    if (newStatus === 'aceito') {
      await prisma.taskListMember.upsert({
        where: {
          listId_userId: {
            listId: invite.listId,
            userId,
          },
        },
        update: {
          role: 'member',
        },
        create: {
          listId: invite.listId,
          userId,
          role: 'member',
        },
      });

      // Notify inviter
      const inviteeName = session?.name || session?.email || 'Um membro';
      await prisma.notification.create({
        data: {
          userId: invite.inviterId,
          type: 'info',
          title: `Convite aceito: ${invite.list.title}`,
          message: `${inviteeName} aceitou seu convite para colaborar na lista "${invite.list.title}"!`,
          data: {
            listId: invite.listId,
            listTitle: invite.list.title,
            groupId: invite.list.groupId,
            groupTitle: invite.list.group.title,
            acceptedByUserId: userId,
            acceptedByName: inviteeName,
          },
        },
      });
    }

    // 3. Mark the notification as read
    await prisma.notification.updateMany({
      where: {
        userId,
        type: 'list_invite',
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      success: true,
      status: newStatus,
      message:
        newStatus === 'aceito'
          ? `Você agora faz parte da lista "${invite.list.title}". Sincronização em tempo real ativada!`
          : `Convite para a lista "${invite.list.title}" recusado.`,
      listId: invite.listId,
      groupId: invite.list.groupId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Cancel invite by list owner
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, message: 'Convite cancelado localmente' });
  }

  try {
    const prisma = getPrisma();
    const invite = await prisma.taskListInvite.findUnique({
      where: { id },
      include: { list: true },
    });

    if (!invite) {
      return NextResponse.json({ success: false, error: 'Convite não encontrado' }, { status: 404 });
    }

    // Only inviter or list owner can cancel
    if (invite.inviterId !== userId && invite.list.ownerId !== userId && session?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Permissão negada para cancelar convite' }, { status: 403 });
    }

    await prisma.taskListInvite.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Convite cancelado com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
