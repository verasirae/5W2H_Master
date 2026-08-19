import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      config: {
        workspaceName: '5W2H Gerenciamento de Rotinas',
        departmentName: 'RH/DP',
        currencySymbol: 'R$',
        attentionThresholdDays: 3,
        departments: ['RH/DP', 'Operações', 'TI / Tecnologia', 'Financeiro / Controladoria'],
        categoriesByDepartment: {
          'RH/DP': ['Folha de Pagamento', 'Recrutamento & Seleção', 'Treinamento & Desenvolvimento', 'Benefícios & Ponto'],
          'Operações': ['Auditoria de Processos', 'Controle de Estoque', 'Manutenção Predial'],
          'TI / Tecnologia': ['Manutenção de Servidores', 'Segurança da Informação', 'Suporte ao Usuário'],
          'Financeiro / Controladoria': ['Fechamento Mensal / Fiscal', 'Fluxo de Caixa & Contas', 'Auditoria Fiscal'],
        },
      },
    });
  }

  try {
    const prisma = getPrisma();
    const [setting, departments, categories] = await Promise.all([
      prisma.workspaceConfig.findUnique({ where: { id: 'default' } }),
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
      prisma.category.findMany({ orderBy: [{ departmentName: 'asc' }, { name: 'asc' }] }),
    ]);

    // Build categoriesByDepartment map from real DB categories
    const categoriesByDeptMap: Record<string, string[]> = {};
    for (const cat of categories) {
      if (!categoriesByDeptMap[cat.departmentName]) {
        categoriesByDeptMap[cat.departmentName] = [];
      }
      categoriesByDeptMap[cat.departmentName].push(cat.name);
    }

    const deptNamesFromDb = departments.map((d) => d.name);
    const deptNames = deptNamesFromDb.length > 0
      ? deptNamesFromDb
      : ((setting?.departments as string[]) || ['RH/DP', 'Operações', 'TI / Tecnologia', 'Financeiro / Controladoria']);

    // Ensure all departments exist in categories map
    for (const d of deptNames) {
      if (!categoriesByDeptMap[d]) {
        categoriesByDeptMap[d] = ((setting?.categoriesByDepartment as Record<string, string[]>) || {})[d] || ['Geral'];
      }
    }

    return NextResponse.json({
      connected: true,
      config: {
        workspaceName: setting?.workspaceName || '5W2H Gerenciamento de Rotinas',
        departmentName: setting?.departmentName || deptNames[0] || 'RH/DP',
        currencySymbol: setting?.currencySymbol || 'R$',
        attentionThresholdDays: setting?.attentionThresholdDays || 3,
        departments: deptNames,
        categoriesByDepartment: categoriesByDeptMap,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        connected: false,
        config: null,
        message: error.message,
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!isDatabaseConfigured()) {
      return NextResponse.json({ success: true, setting: body });
    }

    const prisma = getPrisma();

    const setting = await prisma.workspaceConfig.upsert({
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
        workspaceName: body.workspaceName || '5W2H Gerenciamento de Rotinas',
        departmentName: body.departmentName || 'RH/DP',
        currencySymbol: body.currencySymbol || 'R$',
        attentionThresholdDays: Number(body.attentionThresholdDays) || 3,
        departments: body.departments || [],
        categoriesByDepartment: body.categoriesByDepartment || {},
      },
    });

    // Also synchronize Department and Category tables in PostgreSQL
    if (Array.isArray(body.departments)) {
      for (const deptName of body.departments) {
        if (typeof deptName === 'string' && deptName.trim()) {
          const dept = await prisma.department.upsert({
            where: { name: deptName.trim() },
            update: {},
            create: { name: deptName.trim() },
          });

          const cats = body.categoriesByDepartment?.[deptName.trim()];
          if (Array.isArray(cats)) {
            for (const catName of cats) {
              if (typeof catName === 'string' && catName.trim()) {
                await prisma.category.upsert({
                  where: {
                    name_departmentName: {
                      name: catName.trim(),
                      departmentName: deptName.trim(),
                    },
                  },
                  update: { departmentId: dept.id },
                  create: {
                    name: catName.trim(),
                    departmentName: deptName.trim(),
                    departmentId: dept.id,
                  },
                });
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 200 }
    );
  }
}
