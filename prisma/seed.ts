import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const connectionString = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgresql://postgres:db_postgre_root@localhost:5432/5w2h?schema=public'
).trim().replace(/^["']+|["']+$/g, '');

const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('====================================================');
  console.log('  5W2H MASTER - SEED DO BANCO DE DADOS POSTGRESQL');
  console.log('====================================================');

  try {
    // 1. Criar Workspace Config Padrão
    console.log('[1/5] Configurando Workspace Padrão...');
    await prisma.workspaceConfig.upsert({
      where: { id: 'default' },
      update: {
        workspaceName: '5W2H Gerenciamento de Rotinas',
        departmentName: 'RH/DP',
        currencySymbol: 'R$',
        attentionThresholdDays: 3,
      },
      create: {
        id: 'default',
        workspaceName: '5W2H Gerenciamento de Rotinas',
        departmentName: 'RH/DP',
        currencySymbol: 'R$',
        attentionThresholdDays: 3,
      },
    });
    console.log('✔ WorkspaceConfig configurado.');

    // 2. Criar Departamentos Padrão
    console.log('[2/5] Criando Departamentos Corporativos...');
    const departments = [
      { id: 'dept-rh', name: 'RH/DP', description: 'Recursos Humanos e Departamento Pessoal', color: 'indigo' },
      { id: 'dept-ops', name: 'Operações', description: 'Logística, Produção e Suprimentos', color: 'emerald' },
      { id: 'dept-ti', name: 'TI / Tecnologia', description: 'Sistemas, Infraestrutura e Segurança', color: 'sky' },
      { id: 'dept-fin', name: 'Financeiro / Controladoria', description: 'Contabilidade, Tesouraria e Fiscal', color: 'amber' },
    ];

    for (const dept of departments) {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: { description: dept.description, color: dept.color },
        create: dept,
      });
    }
    console.log('✔ 4 Departamentos criados/atualizados.');

    // 3. Criar Categorias por Departamento
    console.log('[3/5] Criando Categorias de Rotinas...');
    const categories = [
      { name: 'Folha de Pagamento', departmentName: 'RH/DP', departmentId: 'dept-rh' },
      { name: 'Recrutamento & Seleção', departmentName: 'RH/DP', departmentId: 'dept-rh' },
      { name: 'Treinamento & Desenvolvimento', departmentName: 'RH/DP', departmentId: 'dept-rh' },
      { name: 'Benefícios & Ponto', departmentName: 'RH/DP', departmentId: 'dept-rh' },
      { name: 'Auditoria de Processos', departmentName: 'Operações', departmentId: 'dept-ops' },
      { name: 'Controle de Estoque', departmentName: 'Operações', departmentId: 'dept-ops' },
      { name: 'Manutenção de Servidores', departmentName: 'TI / Tecnologia', departmentId: 'dept-ti' },
      { name: 'Segurança da Informação', departmentName: 'TI / Tecnologia', departmentId: 'dept-ti' },
      { name: 'Fechamento Mensal / Fiscal', departmentName: 'Financeiro / Controladoria', departmentId: 'dept-fin' },
      { name: 'Fluxo de Caixa & Contas', departmentName: 'Financeiro / Controladoria', departmentId: 'dept-fin' },
    ];

    for (const cat of categories) {
      await prisma.category.upsert({
        where: {
          name_departmentName: {
            name: cat.name,
            departmentName: cat.departmentName,
          },
        },
        update: { departmentId: cat.departmentId },
        create: cat,
      });
    }
    console.log('✔ Categorias de rotina criadas.');

    // 4. Criar Usuários Iniciais (Admin e Membro)
    console.log('[4/5] Criando Usuários Iniciais com Senhas Criptografadas...');

    // Usuário Administrador Principal
    const adminPasswordHash = hashPassword('admin123456');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@5w2h.local' },
      update: {
        name: 'Administrador 5W2H',
        passwordHash: adminPasswordHash,
        role: 'admin',
        department: 'RH/DP',
        jobTitle: 'Gerente de Compliance & Rotinas',
        status: 'active',
        provider: 'local',
      },
      create: {
        id: 'usr-admin-initial',
        email: 'admin@5w2h.local',
        name: 'Administrador 5W2H',
        passwordHash: adminPasswordHash,
        role: 'admin',
        department: 'RH/DP',
        jobTitle: 'Gerente de Compliance & Rotinas',
        status: 'active',
        provider: 'local',
      },
    });

    // Usuário Pessoal / Alternativo (iraeveras)
    const userPersonalPasswordHash = hashPassword('admin123456');
    await prisma.user.upsert({
      where: { email: 'iraeveras@outlook.com.br' },
      update: {
        name: 'Irae Veras',
        passwordHash: userPersonalPasswordHash,
        role: 'admin',
        department: 'RH/DP',
        jobTitle: 'Gestor de Processos',
        status: 'active',
        provider: 'local',
      },
      create: {
        id: 'usr-irae-veras',
        email: 'iraeveras@outlook.com.br',
        name: 'Irae Veras',
        passwordHash: userPersonalPasswordHash,
        role: 'admin',
        department: 'RH/DP',
        jobTitle: 'Gestor de Processos',
        status: 'active',
        provider: 'local',
      },
    });

    // Usuário Membro da Equipe
    const memberPasswordHash = hashPassword('user123456');
    const memberUser = await prisma.user.upsert({
      where: { email: 'membro@5w2h.local' },
      update: {
        name: 'Membro da Equipe',
        passwordHash: memberPasswordHash,
        role: 'member',
        department: 'Operações',
        jobTitle: 'Analista de Processos',
        status: 'active',
        provider: 'local',
      },
      create: {
        id: 'usr-member-initial',
        email: 'membro@5w2h.local',
        name: 'Membro da Equipe',
        passwordHash: memberPasswordHash,
        role: 'member',
        department: 'Operações',
        jobTitle: 'Analista de Processos',
        status: 'active',
        provider: 'local',
      },
    });

    console.log('✔ Usuários criados com sucesso:');
    console.log('  • Admin: admin@5w2h.local (Senha: admin123456)');
    console.log('  • Admin: iraeveras@outlook.com.br (Senha: admin123456)');
    console.log('  • Membro: membro@5w2h.local (Senha: user123456)');

    // 5. Criar Tarefas 5W2H de Exemplo
    console.log('[5/5] Criando Tarefas Iniciais 5W2H...');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const sampleTasks = [
      {
        id: 'task-5w2h-001',
        title: 'Fechamento da Folha de Pagamento e Encargos Mensais',
        why: 'Garantir conformidade com a legislação trabalhista e pontualidade no pagamento dos colaboradores.',
        where: 'Departamento Pessoal / Sistema ERP Corporativo',
        startDate: todayStr,
        deadlineDate: nextWeek,
        who: 'Ana Silva (Analista de DP)',
        how: 'Conferir lançamentos de horas extras, atestados, benefícios e processar guias do eSocial e FGTS.',
        howMuch: 0,
        department: 'RH/DP',
        category: 'Folha de Pagamento',
        competence: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        priority: 'Alta',
        status: 'Em Andamento',
        progressPercent: 45,
        departmentId: 'dept-rh',
        createdById: adminUser.id,
        assignedUserId: adminUser.id,
      },
      {
        id: 'task-5w2h-002',
        title: 'Auditoria e Inventário Físico do Estoque de Suprimentos',
        why: 'Identificar divergências entre saldo físico e contábil e prevenir rupturas na cadeia de suprimentos.',
        where: 'Almoxarifado Central e Centro de Distribuição',
        startDate: todayStr,
        deadlineDate: nextWeek,
        who: 'Carlos Mendes (Supervisor de Estoque)',
        how: 'Realizar contagem cega com coletores de dados e reconciliar relatório com o ERP.',
        howMuch: 1250.0,
        department: 'Operações',
        category: 'Controle de Estoque',
        competence: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        priority: 'Média',
        status: 'Pendente',
        progressPercent: 10,
        departmentId: 'dept-ops',
        createdById: adminUser.id,
        assignedUserId: memberUser.id,
      },
    ];

    for (const task of sampleTasks) {
      await prisma.task.upsert({
        where: { id: task.id },
        update: task,
        create: task,
      });
    }
    console.log('✔ Tarefas 5W2H de exemplo criadas.');

    console.log('====================================================');
    console.log('✔ SEED DO BANCO DE DADOS CONCLUÍDO COM SUCESSO!');
    console.log('====================================================');
  } catch (error: any) {
    console.error('✖ Erro durante a execução do seed:', error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed();
