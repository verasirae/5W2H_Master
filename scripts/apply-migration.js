#!/usr/bin/env node

/**
 * =========================================================================
 * 5W2H Master - Script de Execução e Aplicação de Migrations no PostgreSQL
 * =========================================================================
 * 
 * 1. Conecta ao PostgreSQL
 * 2. Cria o banco de dados '5w2h' caso ele ainda não exista
 * 3. Executa o arquivo DDL prisma/migrations/schema.sql
 * 4. Valida a criação das tabelas e exibe o resumo completo
 * =========================================================================
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
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

function logInfo(label, value) {
  console.log(`  ${colors.gray}•${colors.reset} ${colors.bright}${label}:${colors.reset} ${value}`);
}

async function runMigration() {
  logHeader('EXECUÇÃO DE MIGRATION - POSTGRESQL LOCAL (BANCO 5W2H)');

  const targetUrl = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:db_postgre_root@localhost:5432/5w2h?schema=public'
  ).trim().replace(/^["']+|["']+$/g, '');

  const isLocal = targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1');

  // Passo 1: Verificar se o banco de dados '5w2h' existe, ou criá-lo via conexão com o banco 'postgres'
  try {
    const urlObj = new URL(targetUrl);
    const targetDbName = urlObj.pathname.replace(/^\//, '') || '5w2h';

    if (targetDbName !== 'postgres') {
      const rootUrl = new URL(targetUrl);
      rootUrl.pathname = '/postgres';

      const rootClient = new Client({
        connectionString: rootUrl.toString(),
        ssl: isLocal ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 4000,
      });

      try {
        await rootClient.connect();
        const checkDbRes = await rootClient.query(
          `SELECT 1 FROM pg_database WHERE datname = $1;`,
          [targetDbName]
        );

        if (checkDbRes.rowCount === 0) {
          console.log(`Banco '${targetDbName}' não encontrado. Criando novo banco de dados...`);
          await rootClient.query(`CREATE DATABASE "${targetDbName}";`);
          logSuccess(`Banco de dados '${targetDbName}' criado com sucesso!`);
        } else {
          logInfo('Status do Banco', `Banco de dados '${targetDbName}' já existe.`);
        }
      } catch (rootErr) {
        // Se não conseguir conectar no root 'postgres', continua direto para o target
        logInfo('Aviso pré-verificação', rootErr.message);
      } finally {
        try {
          await rootClient.end();
        } catch {}
      }
    }
  } catch (parseErr) {
    // Ignora erro de parsing de URL e segue para tentativa direta
  }

  // Passo 2: Conectar ao banco alvo e aplicar schema.sql
  console.log(`\n${colors.bright}[1/3] Conectando ao banco de dados alvo...${colors.reset}`);
  const client = new Client({
    connectionString: targetUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

  try {
    await client.connect();
    logSuccess('Conexão estabelecida com o banco de dados.');

    console.log(`\n${colors.bright}[2/3] Lendo e executando DDL de migração (schema.sql)...${colors.reset}`);
    const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', 'schema.sql');
    
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Arquivo de migração não encontrado em: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sqlContent);
    logSuccess('DDL executado e todas as tabelas/índices/extensões foram aplicados!');

    // Passo 3: Verificar e listar as tabelas criadas
    console.log(`\n${colors.bright}[3/3] Validando tabelas no schema 'public'...${colors.reset}`);
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = res.rows.map((r) => r.table_name);
    tables.forEach((tableName) => {
      logInfo('Tabela Verificada', `${colors.green}${tableName}${colors.reset}`);
    });

    // Passo 4: Sincronizar Prisma Client
    try {
      console.log(`\n${colors.gray}Atualizando Prisma Client (prisma generate)...${colors.reset}`);
      execSync('npx prisma generate', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      logSuccess('Prisma Client sincronizado.');
    } catch (genErr) {
      console.log(`Aviso ao gerar Prisma Client: ${genErr.message}`);
    }

    logHeader('RESULTADO DA MIGRAÇÃO');
    console.log(colors.green + colors.bright + `✔ MIGRAÇÃO CONCLUÍDA COM SUCESSO! (${tables.length} tabelas no schema public)` + colors.reset);
    console.log(colors.gray + `Tabelas prontas para uso: ${tables.join(', ')}\n` + colors.reset);

  } catch (err) {
    console.log(`\n${colors.red}✖ [FALHA NA MIGRAÇÃO]: ${err.message}${colors.reset}\n`);
    process.exit(1);
  } finally {
    try {
      await client.end();
    } catch {}
  }
}

runMigration();
