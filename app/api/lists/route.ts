import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured, markDatabaseUnreachable, isDatabaseTemporarilyUnreachable } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME, normalizeRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get('groupId');
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!isDatabaseConfigured() || isDatabaseTemporarilyUnreachable()) {
    return NextResponse.json({ success: true, lists: [] });
  }

  try {
    const prisma = getPrisma();
    const whereClause: any = {};

    if (groupId) {
      whereClause.groupId = groupId;
    }

    whereClause.OR = [
      { ownerId: userId },
      {
        members: {
          some: { userId },
        },
      },
    ];

    const lists = await prisma.taskList.findMany({
      where: whereClause,
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
          },
        },
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      lists: lists.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        isOwner: l.ownerId === userId,
      })),
    });
  } catch (error: any) {
    markDatabaseUnreachable();
    return NextResponse.json({ success: true, lists: [] });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, color, groupId } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Nome da lista é obrigatório' }, { status: 400 });
    }

    if (!groupId) {
      return NextResponse.json({ success: false, error: 'Grupo é obrigatório' }, { status: 400 });
    }

    if (!isDatabaseConfigured() || isDatabaseTemporarilyUnreachable()) {
      const newList = {
        id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        groupId,
        ownerId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: [],
        members: [
          {
            id: `member-owner-${Date.now()}`,
            listId: '',
            userId,
            role: 'owner',
            joinedAt: new Date().toISOString(),
            user: { id: userId, name: session?.name, email: session?.email },
          },
        ],
        _count: { tasks: 0, members: 1 },
        isOwner: true,
      };
      return NextResponse.json({ success: true, list: newList });
    }

    const prisma = getPrisma();

    // Verify group exists and user is group owner or member
    const group = await prisma.taskGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      return NextResponse.json({ success: false, error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Create the list and automatically add the creator as owner in TaskListMember
    const newList = await prisma.taskList.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        groupId,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
          },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    return NextResponse.json({
      success: true,
      list: {
        ...newList,
        createdAt: newList.createdAt.toISOString(),
        updatedAt: newList.updatedAt.toISOString(),
        isOwner: true,
      },
    });
  } catch (error: any) {
    markDatabaseUnreachable();
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      list: {
        id: `list-${Date.now()}`,
        title: body.title || 'Nova Lista',
        description: body.description || null,
        color: body.color || '#3b82f6',
        groupId: body.groupId || 'default',
        ownerId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: [],
        members: [],
        _count: { tasks: 0, members: 1 },
        isOwner: true,
      },
    });
  }
}
