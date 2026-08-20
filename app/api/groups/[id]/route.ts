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
    return NextResponse.json({ success: true, group: null });
  }

  try {
    const prisma = getPrisma();
    const group = await prisma.taskGroup.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
        lists: {
          include: {
            owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
              },
            },
            _count: { select: { tasks: true, members: true } },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ success: false, error: 'Grupo não encontrado' }, { status: 404 });
    }

    // Access check: owner or member in any list of this group or admin
    const userRole = normalizeRole(session?.role);
    const isMemberOfAnyList = group.lists.some((l) => l.members.some((m) => m.userId === userId));
    if (group.ownerId !== userId && !isMemberOfAnyList && userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acesso não autorizado a este grupo' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      group: {
        ...group,
        createdAt: group.createdAt.toISOString(),
        updatedAt: group.updatedAt.toISOString(),
        isOwner: group.ownerId === userId,
        lists: group.lists.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          updatedAt: l.updatedAt.toISOString(),
          isOwner: l.ownerId === userId,
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
      return NextResponse.json({ success: false, error: 'Título é obrigatório' }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, message: 'Grupo atualizado localmente' });
    }

    const prisma = getPrisma();
    const group = await prisma.taskGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ success: false, error: 'Grupo não encontrado' }, { status: 404 });
    }

    if (group.ownerId !== userId && userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas o criador do grupo pode editá-lo' }, { status: 403 });
    }

    const updated = await prisma.taskGroup.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        color: color || group.color,
      },
    });

    return NextResponse.json({
      success: true,
      group: {
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
    return NextResponse.json({ success: true, message: 'Grupo excluído localmente' });
  }

  try {
    const prisma = getPrisma();
    const group = await prisma.taskGroup.findUnique({ where: { id } });
    if (!group) {
      return NextResponse.json({ success: false, error: 'Grupo não encontrado' }, { status: 404 });
    }

    if (group.ownerId !== userId && userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Apenas o criador do grupo pode excluí-lo' }, { status: 403 });
    }

    await prisma.taskGroup.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Grupo excluído com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
