import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
  }

  try {
    const { id } = await params;
    const prisma = getPrisma();
    const task = await prisma.task.findUnique({ where: { id } });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      task: {
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const prisma = getPrisma();

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
        ...(body.howMuch !== undefined && { howMuch: Number(body.howMuch) }),
        ...(body.department !== undefined && { department: body.department }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.competence !== undefined && { competence: body.competence }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.progressPercent !== undefined && { progressPercent: Number(body.progressPercent) }),
        ...(body.completionDate !== undefined && { completionDate: body.completionDate }),
        ...(body.observations !== undefined && { observations: body.observations }),
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
  } catch (error: any) {
    console.error('Error updating task in Supabase:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
  }

  try {
    const { id } = await params;
    const prisma = getPrisma();
    await prisma.task.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Task ${id} deleted` });
  } catch (error: any) {
    console.error('Error deleting task in Supabase:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
