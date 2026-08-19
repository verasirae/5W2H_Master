import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import {
  verifySessionToken,
  SESSION_COOKIE_NAME,
  normalizeRole,
} from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope'); // 'personal', 'team', 'all'
  const departmentParam = searchParams.get('department');
  const assigneeIdParam = searchParams.get('assigneeId');
  const whoParam = searchParams.get('who');
  const categoryParam = searchParams.get('category');
  const statusParam = searchParams.get('status');

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      message: 'DATABASE_URL not configured. Running in client-storage mode.',
      tasks: [],
    });
  }

  try {
    const prisma = getPrisma();
    const userRole = session ? normalizeRole(session.role) : 'admin';
    const userId = session?.userId;
    const userName = session?.name;

    const whereClause: any = {};

    // 1. RBAC Scoping Filter
    if (userRole === 'membro') {
      // Membro can ONLY see their own tasks
      whereClause.OR = [
        ...(userId ? [{ assignedUserId: userId }] : []),
        ...(userName ? [{ who: userName }] : []),
      ];
    } else if (userRole === 'gestor') {
      if (scope === 'team') {
        // Gestor team monitoring scope
        // Get managed departments for this gestor
        const managedDeptRecords = userId
          ? await prisma.managerDepartment.findMany({
              where: { userId },
              include: { department: true },
            })
          : [];
        
        const managedDeptNames = Array.from(
          new Set([
            ...managedDeptRecords.map((m) => m.department.name),
            session?.department ? session.department : null,
          ].filter(Boolean) as string[])
        );

        if (departmentParam && departmentParam !== 'all') {
          // If gestor specifically requested a department, verify they manage it
          if (managedDeptNames.includes(departmentParam)) {
            whereClause.department = departmentParam;
          } else {
            whereClause.department = { in: managedDeptNames };
          }
        } else {
          whereClause.department = { in: managedDeptNames };
        }

        if (assigneeIdParam && assigneeIdParam !== 'all') {
          whereClause.assignedUserId = assigneeIdParam;
        } else if (whoParam && whoParam !== 'all') {
          whereClause.who = whoParam;
        }
      } else {
        // Default Gestor personal view: only their own tasks
        whereClause.OR = [
          ...(userId ? [{ assignedUserId: userId }] : []),
          ...(userName ? [{ who: userName }] : []),
        ];
      }
    } else {
      // Admin: Global access, apply requested filters directly
      if (departmentParam && departmentParam !== 'all') {
        whereClause.department = departmentParam;
      }
      if (assigneeIdParam && assigneeIdParam !== 'all') {
        whereClause.assignedUserId = assigneeIdParam;
      } else if (whoParam && whoParam !== 'all') {
        whereClause.who = whoParam;
      }
    }

    // Additional general filters
    if (categoryParam && categoryParam !== 'all') {
      whereClause.category = categoryParam;
    }
    if (statusParam && statusParam !== 'all') {
      whereClause.status = statusParam;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
            department: true,
          },
        },
      },
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
    return NextResponse.json(
      {
        connected: false,
        message: error.message || 'Database currently offline or unreachable.',
        tasks: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { connected: false, message: 'DATABASE_URL not configured.' },
      { status: 200 }
    );
  }

  try {
    const prisma = getPrisma();
    const body = await req.json();

    const processItem = async (item: any) => {
      let assignedUserId = item.assignedUserId || null;
      let who = item.who?.trim() || 'Não atribuído';

      // If assignedUserId provided, link who to user's name
      if (assignedUserId) {
        const u = await prisma.user.findUnique({ where: { id: assignedUserId } });
        if (u) {
          who = u.name || u.email;
        }
      } else if (who && who !== 'Não atribuído') {
        // Try linking who by name or email
        const u = await prisma.user.findFirst({
          where: {
            OR: [{ name: who }, { email: who }],
          },
        });
        if (u) {
          assignedUserId = u.id;
          who = u.name || who;
        }
      }

      // Department & Category linking
      let departmentId = item.departmentId || null;
      if (!departmentId && item.department) {
        const dept = await prisma.department.findUnique({ where: { name: item.department } });
        if (dept) departmentId = dept.id;
      }

      let categoryId = item.categoryId || null;
      if (!categoryId && item.category && item.department) {
        const cat = await prisma.category.findUnique({
          where: {
            name_departmentName: {
              name: item.category,
              departmentName: item.department,
            },
          },
        });
        if (cat) categoryId = cat.id;
      }

      return {
        id: item.id,
        title: item.title,
        why: item.why,
        where: item.where,
        startDate: item.startDate,
        deadlineDate: item.deadlineDate,
        who,
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
        departmentId,
        categoryId,
        assignedUserId,
        createdById: item.createdById || session?.userId || null,
      };
    };

    if (Array.isArray(body)) {
      const processed = await Promise.all(body.map(processItem));
      const upserted = await prisma.$transaction(
        processed.map((item) =>
          prisma.task.upsert({
            where: { id: item.id },
            update: item,
            create: item,
          })
        )
      );

      return NextResponse.json({ success: true, count: upserted.length });
    }

    const itemData = await processItem(body);
    const newTask = await prisma.task.upsert({
      where: { id: itemData.id },
      update: itemData,
      create: itemData,
      include: {
        assignedUser: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
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
      { success: false, error: error.message || 'Erro ao salvar tarefa no banco' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, error: 'ID da tarefa é obrigatório.' }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ success: true, message: 'Tarefa deletada no modo local.' });
  }

  try {
    const prisma = getPrisma();
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Tarefa excluída do banco com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
