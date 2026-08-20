import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      success: true,
      notifications: [],
      pendingInvitesCount: 0,
      unreadCount: 0,
    });
  }

  try {
    const prisma = getPrisma();

    // 1. Fetch user notifications
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 2. Fetch pending invites specifically to ensure synchronization
    const pendingInvites = await prisma.taskListInvite.findMany({
      where: {
        inviteeId: userId,
        status: 'pendente',
      },
      include: {
        list: {
          include: {
            group: true,
          },
        },
        inviter: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({
      success: true,
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      pendingInvites: pendingInvites.map((inv) => ({
        ...inv,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      })),
      unreadCount: unreadCount + pendingInvites.length,
      pendingInvitesCount: pendingInvites.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Mark notifications as read
export async function PUT(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, message: 'Notificações marcadas como lidas' });
    }

    const prisma = getPrisma();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationId) {
      await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true, message: 'Atualizado com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Delete notification
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const notificationId = searchParams.get('id');

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!notificationId) {
    return NextResponse.json({ success: false, error: 'ID da notificação é obrigatório' }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, message: 'Notificação excluída' });
  }

  try {
    const prisma = getPrisma();
    await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });

    return NextResponse.json({ success: true, message: 'Notificação removida' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
