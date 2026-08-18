import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

async function main() {
  console.log('====================================================');
  console.log('  TESTE DE CONECTIVIDADE COM O POSTGRESQL (PRISMA)');
  console.log('====================================================');

  const connectionString = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:db_postgre_root@localhost:5432/5w2h?schema=public'
  ).trim().replace(/^["']+|["']+$/g, '');

  console.log(`[1/3] Iniciando conexão...`);
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  const adapter = new PrismaPg(pool);
  // Instanciação segura com suporte a driver adapter
  const prisma: PrismaClient = new (PrismaClient as any)({
    adapter,
    log: ['error'],
  });

  try {
    const start = Date.now();

    // 1. Executa a consulta simples SELECT 1
    console.log(`[2/3] Executando consulta simples: SELECT 1 ...`);
    const result = await prisma.$queryRaw<Array<{ ping: number }>>`SELECT 1 as ping;`;
    const latency = Date.now() - start;

    console.log('✔ Resultado da consulta SELECT 1:', result);
    console.log(`✔ Latência de resposta: ${latency}ms`);

    // 2. Consulta adicional para verificar versão do PostgreSQL
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version();`;
    if (versionResult.length > 0) {
      console.log('✔ Versão do PostgreSQL:', versionResult[0].version.split(',')[0]);
    }

    // 3. Verifica contagem de tabelas do sistema
    console.log(`[3/3] Verificando modelos e tabelas no Prisma...`);
    const [userCount, taskCount, departmentCount] = await Promise.all([
      prisma.user.count().catch(() => -1),
      prisma.task.count().catch(() => -1),
      prisma.department.count().catch(() => -1),
    ]);

    console.log('--- Resumo das Tabelas ---');
    console.log(`• Usuários cadastrados: ${userCount >= 0 ? userCount : 'Tabela não criada'}`);
    console.log(`• Tarefas 5W2H: ${taskCount >= 0 ? taskCount : 'Tabela não criada'}`);
    console.log(`• Departamentos: ${departmentCount >= 0 ? departmentCount : 'Tabela não criada'}`);

    console.log('====================================================');
    console.log('✔ CONECTIVIDADE COM O BANCO DE DADOS TESTADA COM SUCESSO!');
    console.log('====================================================');
  } catch (error: any) {
    console.error('✖ Falha ao conectar ou executar consulta no banco de dados:');
    console.error(error.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
