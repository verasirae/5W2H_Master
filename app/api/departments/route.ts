import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      departments: [
        { id: 'dept-rh', name: 'RH/DP', description: 'Recursos Humanos e Departamento Pessoal', color: 'indigo', _count: { categories: 4, tasks: 0 } },
        { id: 'dept-ops', name: 'Operações', description: 'Logística, Produção e Suprimentos', color: 'emerald', _count: { categories: 2, tasks: 0 } },
        { id: 'dept-ti', name: 'TI / Tecnologia', description: 'Sistemas, Infraestrutura e Segurança', color: 'sky', _count: { categories: 2, tasks: 0 } },
        { id: 'dept-fin', name: 'Financeiro / Controladoria', description: 'Contabilidade, Tesouraria e Fiscal', color: 'amber', _count: { categories: 2, tasks: 0 } },
      ],
    });
  }

  try {
    const prisma = getPrisma();
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        categories: {
          select: { id: true, name: true },
        },
        _count: {
          select: { tasks: true, categories: true },
        },
      },
    });

    return NextResponse.json({
      connected: true,
      departments,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Falha ao buscar departamentos',
        departments: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Nome do departamento é obrigatório.' }, { status: 400 });
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        department: {
          id: `dept-${Date.now()}`,
          name,
          description: body.description || null,
          color: body.color || 'blue',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const prisma = getPrisma();
    const department = await prisma.department.upsert({
      where: { name },
      update: {
        description: body.description ?? undefined,
        color: body.color ?? undefined,
      },
      create: {
        name,
        description: body.description || null,
        color: body.color || 'blue',
      },
    });

    // Also synchronize workspace config Json if present
    const ws = await prisma.workspaceConfig.findUnique({ where: { id: 'default' } });
    if (ws) {
      const currentDeps = (ws.departments as string[]) || [];
      if (!currentDeps.includes(name)) {
        await prisma.workspaceConfig.update({
          where: { id: 'default' },
          data: {
            departments: [...currentDeps, name],
          },
        });
      }
    }

    return NextResponse.json({ success: true, department });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
