import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task: {
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error(`Error querying task:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar tarefa' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const prisma = getPrisma();

    // Check if task exists in database
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (existing) {
      // Update existing record
      const updated = await prisma.task.update({
        where: { id },
        data: {
          ...(body.title !== undefined && { title: body.title }),
          ...(body.why !== undefined && { why: body.why }),
          ...(body.where !== undefined && { where: body.where }),
          ...(body.startDate !== undefined && { startDate: body.startDate }),
          ...(body.deadlineDate !== undefined && { deadlineDate: body.deadlineDate }),
          ...(body.who !== undefined && { who: body.who }),
          ...(body.how !== undefined && { how: body.how }),
          ...(body.howMuch !== undefined && { howMuch: Number(body.howMuch) || 0 }),
          ...(body.department !== undefined && { department: body.department }),
          ...(body.category !== undefined && { category: body.category }),
          ...(body.competence !== undefined && { competence: body.competence }),
          ...(body.priority !== undefined && { priority: body.priority }),
          ...(body.status !== undefined && { status: body.status }),
          ...(body.progressPercent !== undefined && {
            progressPercent: Number(body.progressPercent) || 0,
          }),
          ...(body.completionDate !== undefined && {
            completionDate: body.completionDate || null,
          }),
          ...(body.observations !== undefined && {
            observations: body.observations || null,
          }),
        },
      });

      return NextResponse.json({
        success: true,
        task: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    }

    // If record doesn't exist yet in the database (e.g. was stored locally/cache), create it safely
    const created = await prisma.task.create({
      data: {
        id,
        title: body.title || 'Ação 5W2H',
        why: body.why || '',
        where: body.where || '',
        startDate: body.startDate || new Date().toISOString().slice(0, 10),
        deadlineDate: body.deadlineDate || new Date().toISOString().slice(0, 10),
        who: body.who || 'Responsável',
        how: body.how || '',
        howMuch: Number(body.howMuch) || 0,
        department: body.department || 'RH/DP',
        category: body.category || 'Geral',
        competence: body.competence || new Date().toISOString().slice(0, 7),
        priority: body.priority || 'Média',
        status: body.status || 'Não iniciado',
        progressPercent: Number(body.progressPercent) || 0,
        completionDate: body.completionDate || null,
        observations: body.observations || null,
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        ...created,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error(`Error updating task:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar tarefa' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Database not configured' },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const prisma = getPrisma();

    // Use deleteMany to avoid throwing P2025 if record was already deleted or only in client storage
    await prisma.task.deleteMany({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Tarefa ${id} excluída com sucesso.`,
    });
  } catch (error: any) {
    console.error(`Error deleting task:`, error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir tarefa' },
      { status: 500 }
    );
  }
}
