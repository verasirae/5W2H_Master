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
      return NextResponse.json({ success: true, department: { id, ...body } });
    }

    const prisma = getPrisma();
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Departamento não encontrado' }, { status: 404 });
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.color !== undefined && { color: body.color }),
      },
    });

    return NextResponse.json({ success: true, department: updated });
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
      return NextResponse.json({ success: true, message: 'Departamento excluído' });
    }

    const prisma = getPrisma();
    const dept = await prisma.department.findUnique({ where: { id } });
    if (!dept) {
      return NextResponse.json({ success: true, message: 'Departamento não existia' });
    }

    // Delete categories associated
    await prisma.category.deleteMany({ where: { departmentName: dept.name } }).catch(() => {});
    await prisma.department.delete({ where: { id } });

    // Update workspaceConfig
    const ws = await prisma.workspaceConfig.findUnique({ where: { id: 'default' } });
    if (ws) {
      const currentDeps = ((ws.departments as string[]) || []).filter((d) => d !== dept.name);
      const currentCats = { ...((ws.categoriesByDepartment as Record<string, string[]>) || {}) };
      delete currentCats[dept.name];

      await prisma.workspaceConfig.update({
        where: { id: 'default' },
        data: {
          departments: currentDeps,
          categoriesByDepartment: currentCats,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Departamento excluído com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
