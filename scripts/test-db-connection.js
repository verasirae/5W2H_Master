#!/usr/bin/env node

/**
 * =========================================================================
 * 5W2H Master - Script de Teste de Conexão com o Banco de Dados PostgreSQL
 * Compatível com Prisma 7 (@prisma/adapter-pg + prisma.config.ts)
 * =========================================================================
 */

require('dotenv/config');
const { Client, Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function logHeader(title) {
  console.log('\n' + colors.cyan + colors.bright + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + colors.bright + `  ${title}` + colors.reset);
  console.log(colors.cyan + colors.bright + '═'.repeat(60) + colors.reset);
}

function logSuccess(msg) {
  console.log(`${colors.green}✔ [SUCESSO]${colors.reset} ${msg}`);
}

function logWarning(msg) {
  console.log(`${colors.yellow}⚠ [AVISO]${colors.reset} ${msg}`);
}

function logError(msg) {
  console.log(`${colors.red}✖ [ERRO]${colors.reset} ${msg}`);
}

function logInfo(label, value) {
  console.log(`  ${colors.gray}•${colors.reset} ${colors.bright}${label}:${colors.reset} ${value}`);
}

async function testConnection() {
  logHeader('TESTE DE CONEXÃO COM O BANCO DE DADOS POSTGRESQL (PRISMA 7)');

  const rawUrl = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:db_postgre_root@localhost:5432/5w2h?schema=public'
  ).trim().replace(/^["']+|["']+$/g, '');

  // 1. Validar e Mascarar a URL para exibição segura
  let maskedUrl = rawUrl;
  try {
    const urlObj = new URL(rawUrl);
    const host = urlObj.hostname;
    const port = urlObj.port || '5432';
    const dbName = urlObj.pathname.replace(/^\//, '');
    const user = urlObj.username;

    logInfo('Ambiente', process.env.NODE_ENV || 'development');
    logInfo('Host do Banco', host);
    logInfo('Porta', port);
    logInfo('Nome do Banco', dbName || '5w2h');
    logInfo('Usuário', user);

    if (urlObj.password) {
      urlObj.password = '••••••••';
      maskedUrl = urlObj.toString();
    }
  } catch (err) {
    logWarning(`Formato de URL customizado: ${rawUrl}`);
  }

  logInfo('URL de Conexão', maskedUrl);
  console.log('');

  // 2. Testar Conexão Direta com Driver Nativo 'pg'
  console.log(`${colors.bright}[1/3] Testando Conectividade Direta via Driver 'pg'...${colors.reset}`);
  const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');
  const pgClient = new Client({
    connectionString: rawUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  const startTime = Date.now();
  let pgConnected = false;

  try {
    await pgClient.connect();
    const latency = Date.now() - startTime;
    pgConnected = true;
    logSuccess(`Conectado com sucesso ao PostgreSQL via 'pg' (${latency}ms)!`);

    const versionRes = await pgClient.query('SELECT version();');
    const timeRes = await pgClient.query('SELECT NOW() as current_time, current_database() as db_name, current_user as user_name;');

    const fullVersion = versionRes.rows[0]?.version || 'Desconhecida';
    const shortVersion = fullVersion.split(',')[0];
    const serverTime = timeRes.rows[0]?.current_time;
    const activeDb = timeRes.rows[0]?.db_name;

    logInfo('Versão do PostgreSQL', shortVersion);
    logInfo('Banco Ativo no Servidor', activeDb);
    logInfo('Horário no Servidor', serverTime ? new Date(serverTime).toLocaleString('pt-BR') : 'N/A');

    // Verificar tabelas existentes
    const tablesRes = await pgClient.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const existingTables = tablesRes.rows.map((r) => r.table_name);
    console.log(`\n${colors.bright}[2/3] Verificando Tabelas no Schema 'public'...${colors.reset}`);
    
    const requiredTables = ['User', 'Task', 'Department', 'Category', 'WorkspaceConfig'];
    logInfo('Total de Tabelas Encontradas', existingTables.length);

    if (existingTables.length > 0) {
      console.log(`  ${colors.gray}Tabelas presentes:${colors.reset} ${existingTables.map((t) => colors.green + t + colors.reset).join(', ')}`);
    }

    const missingTables = requiredTables.filter((t) => !existingTables.includes(t));
    if (missingTables.length === 0) {
      logSuccess('Todas as tabelas do 5W2H Master estão presentes no banco de dados!');
    } else {
      logWarning(`Tabelas ausentes: ${missingTables.join(', ')}. Execute a migração para criá-las.`);
    }

  } catch (pgErr) {
    logError(`Falha ao conectar via driver 'pg': ${pgErr.message}`);
  } finally {
    try {
      await pgClient.end();
    } catch {}
  }

  // 3. Testar Conexão e Modelos via Prisma ORM v7 com @prisma/adapter-pg
  console.log(`\n${colors.bright}[3/3] Testando Conexão via Prisma ORM v7 (@prisma/adapter-pg)...${colors.reset}`);
  const pool = new Pool({
    connectionString: rawUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter, log: ['error'] });

  try {
    const prismaStartTime = Date.now();
    const prismaPing = await prisma.$queryRaw`SELECT 1 as ping`;
    const prismaLatency = Date.now() - prismaStartTime;

    if (prismaPing) {
      logSuccess(`Prisma 7 conectado via adapter-pg e operacional (${prismaLatency}ms)!`);

      try {
        const [userCount, taskCount, deptCount] = await Promise.all([
          prisma.user.count().catch(() => null),
          prisma.task.count().catch(() => null),
          prisma.department.count().catch(() => null),
        ]);

        if (userCount !== null) logInfo('Total de Usuários', userCount);
        if (taskCount !== null) logInfo('Total de Tarefas (5W2H)', taskCount);
        if (deptCount !== null) logInfo('Total de Departamentos', deptCount);
      } catch (countErr) {
        logWarning(`Não foi possível contar registros: ${countErr.message}`);
      }
    }
  } catch (prismaErr) {
    logError(`Falha ao conectar via Prisma Client v7: ${prismaErr.message}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  logHeader('RESUMO DO TESTE');
  if (pgConnected) {
    console.log(colors.green + colors.bright + '✔ CONEXÃO COM O BANCO DE DADOS ESTABELECIDA COM SUCESSO (PRISMA 7)!' + colors.reset);
    console.log(colors.gray + 'A aplicação está conectada e operando com prisma.config.ts e adapter-pg.\n' + colors.reset);
    process.exit(0);
  } else {
    console.log(colors.red + colors.bright + '✖ NÃO FOI POSSÍVEL CONECTAR AO BANCO DE DADOS POSTGRESQL.' + colors.reset);
    process.exit(1);
  }
}

testConnection();
