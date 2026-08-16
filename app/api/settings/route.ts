import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ connected: false, config: null });
  }

  try {
    const prisma = getPrisma();
    const setting = await prisma.workspaceSetting.findUnique({
      where: { id: 'default' },
    });

    if (!setting) {
      return NextResponse.json({ connected: true, config: null });
    }

    return NextResponse.json({
      connected: true,
      config: {
        workspaceName: setting.workspaceName,
        departmentName: setting.departmentName,
        currencySymbol: setting.currencySymbol,
        attentionThresholdDays: setting.attentionThresholdDays,
        departments: setting.departments as string[],
        categoriesByDepartment: setting.categoriesByDepartment as Record<string, string[]>,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const prisma = getPrisma();

    const setting = await prisma.workspaceSetting.upsert({
      where: { id: 'default' },
      update: {
        workspaceName: body.workspaceName,
        departmentName: body.departmentName,
        currencySymbol: body.currencySymbol,
        attentionThresholdDays: Number(body.attentionThresholdDays) || 3,
        departments: body.departments || [],
        categoriesByDepartment: body.categoriesByDepartment || {},
      },
      create: {
        id: 'default',
        workspaceName: body.workspaceName,
        departmentName: body.departmentName,
        currencySymbol: body.currencySymbol,
        attentionThresholdDays: Number(body.attentionThresholdDays) || 3,
        departments: body.departments || [],
        categoriesByDepartment: body.categoriesByDepartment || {},
      },
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
