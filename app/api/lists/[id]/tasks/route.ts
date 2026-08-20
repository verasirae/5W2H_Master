import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { verifySessionToken, SESSION_COOKIE_NAME, normalizeRole } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// GET tasks for a specific list
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, tasks: [] });
  }

  try {
    const prisma = getPrisma();
    const tasks = await prisma.task.findMany({
      where: { listId: id },
      include: {
        assignedUser: { select: { id: true, name: true, email: true, avatarUrl: true, role: true, department: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      tasks: tasks.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Link existing task(s) to this list
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
    const { taskIds, unlink } = body; // taskIds: string[]

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ success: false, error: 'Lista de tarefas inválida' }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, message: 'Tarefas atualizadas localmente' });
    }

    const prisma = getPrisma();
    const list = await prisma.taskList.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!list) {
      return NextResponse.json({ success: false, error: 'Lista não encontrada' }, { status: 404 });
    }

    const isMember = list.members.some((m) => m.userId === userId) || list.ownerId === userId;
    if (!isMember && userRole !== 'admin') {
      return NextResponse.json({ success: false, error: 'Permissão negada' }, { status: 403 });
    }

    // Link or unlink
    await prisma.task.updateMany({
      where: { id: { in: taskIds } },
      data: {
        listId: unlink ? null : id,
      },
    });

    return NextResponse.json({
      success: true,
      message: unlink ? 'Tarefas desvinculadas da lista com sucesso' : 'Tarefas vinculadas à lista com sucesso',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Unlink a single task from list
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;
  const userId = session?.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (!taskId) {
    return NextResponse.json({ success: false, error: 'ID da tarefa é obrigatório' }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, message: 'Tarefa desvinculada localmente' });
  }

  try {
    const prisma = getPrisma();
    await prisma.task.update({
      where: { id: taskId, listId: id },
      data: { listId: null },
    });

    return NextResponse.json({ success: true, message: 'Tarefa desvinculada da lista' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
