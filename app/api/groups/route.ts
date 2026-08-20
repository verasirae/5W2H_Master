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
      groups: [],
      message: 'Modo local de armazenamento ativo.',
    });
  }

  try {
    const prisma = getPrisma();

    // Find groups owned by user OR groups containing lists where user is a member
    const groups = await prisma.taskGroup.findMany({
      where: {
        OR: [
          { ownerId: userId },
          {
            lists: {
              some: {
                members: {
                  some: { userId },
                },
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        lists: {
          include: {
            owner: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true },
                },
              },
            },
            _count: {
              select: {
                tasks: true,
                members: true,
              },
            },
          },
        },
        _count: {
          select: {
            lists: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedGroups = groups.map((g) => ({
      ...g,
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      isOwner: g.ownerId === userId,
      lists: g.lists.map((l) => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
        updatedAt: l.updatedAt.toISOString(),
        isOwner: l.ownerId === userId,
      })),
    }));

    return NextResponse.json({ success: true, groups: formattedGroups });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao carregar grupos' },
      { status: 500 }
    );
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
    const { title, description, color } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Título do grupo é obrigatório' }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      const newGroup = {
        id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: title.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        ownerId: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lists: [],
        _count: { lists: 0 },
        isOwner: true,
      };
      return NextResponse.json({ success: true, group: newGroup });
    }

    const prisma = getPrisma();
    const group = await prisma.taskGroup.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        color: color || '#3b82f6',
        ownerId: userId,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        lists: true,
        _count: { select: { lists: true } },
      },
    });

    return NextResponse.json({
      success: true,
      group: {
        ...group,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
        isOwner: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar grupo' },
      { status: 500 }
    );
  }
}
