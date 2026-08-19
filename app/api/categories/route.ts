import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentName = searchParams.get('department');

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      categories: [],
    });
  }

  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      where: departmentName ? { departmentName } : undefined,
      orderBy: [{ departmentName: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    return NextResponse.json({
      connected: true,
      categories,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Falha ao buscar categorias',
        categories: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = body.name?.trim();
    const departmentName = body.departmentName?.trim();

    if (!name || !departmentName) {
      return NextResponse.json(
        { success: false, error: 'Nome e Departamento são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        category: {
          id: `cat-${Date.now()}`,
          name,
          departmentName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const prisma = getPrisma();

    // Check if department exists to link
    const dept = await prisma.department.findUnique({
      where: { name: departmentName },
    });

    const category = await prisma.category.upsert({
      where: {
        name_departmentName: {
          name,
          departmentName,
        },
      },
      update: {
        departmentId: dept?.id || null,
      },
      create: {
        name,
        departmentName,
        departmentId: dept?.id || null,
      },
    });

    // Update workspaceConfig
    const ws = await prisma.workspaceConfig.findUnique({ where: { id: 'default' } });
    if (ws) {
      const catsMap = ((ws.categoriesByDepartment as Record<string, string[]>) || {});
      const list = catsMap[departmentName] || [];
      if (!list.includes(name)) {
        await prisma.workspaceConfig.update({
          where: { id: 'default' },
          data: {
            categoriesByDepartment: {
              ...catsMap,
              [departmentName]: [...list, name],
            },
          },
        });
      }
    }

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
