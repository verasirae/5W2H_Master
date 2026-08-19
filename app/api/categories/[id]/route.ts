import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const name = body.name?.trim();

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, category: { id, ...body } });
    }

    const prisma = getPrisma();
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(body.departmentName && { departmentName: body.departmentName }),
      },
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, message: 'Categoria excluída' });
    }

    const prisma = getPrisma();
    const cat = await prisma.category.findUnique({ where: { id } });
    if (!cat) {
      return NextResponse.json({ success: true, message: 'Categoria não existia' });
    }

    await prisma.category.delete({ where: { id } });

    // Update workspaceConfig
    const ws = await prisma.workspaceConfig.findUnique({ where: { id: 'default' } });
    if (ws) {
      const catsMap = { ...((ws.categoriesByDepartment as Record<string, string[]>) || {}) };
      if (catsMap[cat.departmentName]) {
        catsMap[cat.departmentName] = catsMap[cat.departmentName].filter((c) => c !== cat.name);
        await prisma.workspaceConfig.update({
          where: { id: 'default' },
          data: { categoriesByDepartment: catsMap },
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Categoria excluída com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
