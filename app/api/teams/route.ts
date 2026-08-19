import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');
  const departmentName = searchParams.get('departmentName');

  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      teams: [
        { id: 'team-folha', name: 'Folha e Encargos', departmentId: 'dept-rh' },
        { id: 'team-recrut', name: 'Recrutamento & Seleção', departmentId: 'dept-rh' },
        { id: 'team-log', name: 'Logística e Frota', departmentId: 'dept-ops' },
        { id: 'team-dev', name: 'Desenvolvimento e Sistemas', departmentId: 'dept-ti' },
      ],
    });
  }

  try {
    const prisma = getPrisma();
    const whereClause: any = {};

    if (departmentId) {
      whereClause.departmentId = departmentId;
    } else if (departmentName) {
      const dept = await prisma.department.findUnique({ where: { name: departmentName } });
      if (dept) {
        whereClause.departmentId = dept.id;
      }
    }

    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { members: true, managers: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      connected: true,
      teams,
    });
  } catch (error: any) {
    return NextResponse.json(
      { connected: false, error: error.message, teams: [] },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, departmentId, departmentName, description } = body;

    if (!name || (!departmentId && !departmentName)) {
      return NextResponse.json(
        { success: false, error: 'Nome da equipe e departamento são obrigatórios.' },
        { status: 400 }
      );
    }

    if (!isDatabaseConfigured()) {
      return NextResponse.json({
        success: true,
        team: {
          id: `team-${Date.now()}`,
          name,
          departmentId: departmentId || 'dept-rh',
          description,
        },
      });
    }

    const prisma = getPrisma();
    let targetDeptId = departmentId;

    if (!targetDeptId && departmentName) {
      const dept = await prisma.department.upsert({
        where: { name: departmentName },
        update: {},
        create: { name: departmentName },
      });
      targetDeptId = dept.id;
    }

    const team = await prisma.team.upsert({
      where: {
        name_departmentId: {
          name,
          departmentId: targetDeptId,
        },
      },
      update: {
        description: description || undefined,
      },
      create: {
        name,
        departmentId: targetDeptId,
        description: description || null,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
