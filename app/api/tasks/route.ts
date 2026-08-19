import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      message: 'DATABASE_URL not configured. Running in client-storage mode.',
      tasks: [],
    });
  }

  try {
    const prisma = getPrisma();
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      connected: true,
      tasks: tasks.map((t) => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    // Graceful fallback when PostgreSQL is unreachable or table is not ready yet
    return NextResponse.json(
      {
        connected: false,
        message: error.message || 'Database currently offline or unreachable. Operating in local storage mode.',
        tasks: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { connected: false, message: 'DATABASE_URL not configured.' },
      { status: 200 }
    );
  }

  try {
    const prisma = getPrisma();
    const body = await req.json();

    // Check if bulk insert or single insert
    if (Array.isArray(body)) {
      const created = await prisma.$transaction(
        body.map((item) =>
          prisma.task.upsert({
            where: { id: item.id },
            update: {
              title: item.title,
              why: item.why,
              where: item.where,
              startDate: item.startDate,
              deadlineDate: item.deadlineDate,
              who: item.who,
              how: item.how,
              howMuch: Number(item.howMuch) || 0,
              department: item.department,
              category: item.category,
              competence: item.competence,
              priority: item.priority,
              status: item.status,
              progressPercent: Number(item.progressPercent) || 0,
              completionDate: item.completionDate || null,
              observations: item.observations || null,
            },
            create: {
              id: item.id,
              title: item.title,
              why: item.why,
              where: item.where,
              startDate: item.startDate,
              deadlineDate: item.deadlineDate,
              who: item.who,
              how: item.how,
              howMuch: Number(item.howMuch) || 0,
              department: item.department,
              category: item.category,
              competence: item.competence,
              priority: item.priority,
              status: item.status,
              progressPercent: Number(item.progressPercent) || 0,
              completionDate: item.completionDate || null,
              observations: item.observations || null,
            },
          })
        )
      );

      return NextResponse.json({ success: true, count: created.length });
    }

    const newTask = await prisma.task.upsert({
      where: { id: body.id },
      update: {
        title: body.title,
        why: body.why,
        where: body.where,
        startDate: body.startDate,
        deadlineDate: body.deadlineDate,
        who: body.who,
        how: body.how,
        howMuch: Number(body.howMuch) || 0,
        department: body.department,
        category: body.category,
        competence: body.competence,
        priority: body.priority,
        status: body.status,
        progressPercent: Number(body.progressPercent) || 0,
        completionDate: body.completionDate || null,
        observations: body.observations || null,
      },
      create: {
        id: body.id,
        title: body.title,
        why: body.why,
        where: body.where,
        startDate: body.startDate,
        deadlineDate: body.deadlineDate,
        who: body.who,
        how: body.how,
        howMuch: Number(body.howMuch) || 0,
        department: body.department,
        category: body.category,
        competence: body.competence,
        priority: body.priority,
        status: body.status,
        progressPercent: Number(body.progressPercent) || 0,
        completionDate: body.completionDate || null,
        observations: body.observations || null,
      },
    });

    return NextResponse.json({
      success: true,
      task: {
        ...newTask,
        createdAt: newTask.createdAt.toISOString(),
        updatedAt: newTask.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, connected: false, error: error.message || 'Failed to save task to database' },
      { status: 200 }
    );
  }
}
