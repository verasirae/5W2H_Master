import type { PrismaClient } from '@prisma/client';
import type { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
  var schemaEnsuredGlobal: boolean | undefined;
}

/**
 * Helper to get clean sanitized database URL without quotes or whitespace.
 * Returns empty string if DATABASE_URL or POSTGRES_URL is not set.
 */
export function getSanitizedDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  if (typeof raw !== 'string' || !raw.trim()) {
    return '';
  }
  return raw.trim().replace(/^["']+|["']+$/g, '');
}

/**
 * Checks if the DATABASE_URL environment variable is provided, valid, and not a placeholder.
 */
export function isDatabaseConfigured(): boolean {
  const trimmed = getSanitizedDatabaseUrl();
  if (!trimmed) return false;

  // Must strictly start with standard PostgreSQL URI protocol
  if (!trimmed.startsWith('postgresql://') && !trimmed.startsWith('postgres://')) {
    return false;
  }

  // Check common unpopulated placeholder patterns
  if (
    trimmed.includes('your-password') ||
    trimmed.includes('your-project-ref') ||
    trimmed.includes('[YOUR-') ||
    trimmed.includes('<password>') ||
    trimmed.includes('YOUR_DATABASE_URL') ||
    trimmed.includes('MY_')
  ) {
    return false;
  }

  return true;
}

function hashSeedPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Ensures all PostgreSQL database tables, relations, and initial admin users exist.
 * Runs idempotently (using CREATE TABLE IF NOT EXISTS / ALTER TABLE ADD COLUMN IF NOT EXISTS).
 */
export async function ensureDatabaseSchema(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  if (global.schemaEnsuredGlobal) return true;

  const connectionString = getSanitizedDatabaseUrl();
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

  try {
    const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', 'schema.sql');
    let sqlContent = '';
    if (fs.existsSync(sqlPath)) {
      sqlContent = fs.readFileSync(sqlPath, 'utf8');
    }

    if (sqlContent) {
      await pool.query(sqlContent);
    }

    // Seed default administrator accounts if not exist
    const adminPass = hashSeedPassword('admin123456');
    const userPass = hashSeedPassword('user123456');

    // Upsert default accounts into User table
    await pool.query(`
      INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "department", "jobTitle", "status", "provider")
      VALUES
        ('usr-admin-initial', 'admin@5w2h.local', 'Administrador 5W2H', $1, 'admin', 'RH/DP', 'Gerente de Compliance', 'ativo', 'local'),
        ('usr-irae-veras', 'iraeveras@outlook.com.br', 'Irae Veras', $1, 'admin', 'RH/DP', 'Gestor de Processos', 'ativo', 'local'),
        ('usr-gestor-demo', 'gestor@5w2h.local', 'Gestor de Operações', $1, 'gestor', 'Operações', 'Coordenador Operacional', 'ativo', 'local'),
        ('usr-member-initial', 'membro@5w2h.local', 'Membro da Equipe', $2, 'membro', 'Operações', 'Analista de Processos', 'ativo', 'local')
      ON CONFLICT ("email") DO UPDATE SET
        "status" = 'ativo',
        "role" = EXCLUDED."role",
        "passwordHash" = COALESCE("User"."passwordHash", EXCLUDED."passwordHash");
    `, [adminPass, userPass]).catch(() => {});

    // Ensure default departments exist
    await pool.query(`
      INSERT INTO "Department" ("id", "name", "description", "color")
      VALUES
        ('dept-rh', 'RH/DP', 'Recursos Humanos e Departamento Pessoal', 'indigo'),
        ('dept-ops', 'Operações', 'Logística, Produção e Suprimentos', 'emerald'),
        ('dept-ti', 'TI / Tecnologia', 'Sistemas, Infraestrutura e Segurança', 'sky'),
        ('dept-fin', 'Financeiro / Controladoria', 'Contabilidade, Tesouraria e Fiscal', 'amber')
      ON CONFLICT ("name") DO NOTHING;
    `).catch(() => {});

    // Ensure default workspace configuration exists
    await pool.query(`
      INSERT INTO "WorkspaceConfig" ("id", "workspaceName", "departmentName", "currencySymbol", "attentionThresholdDays")
      VALUES ('default', '5W2H Gerenciamento de Rotinas', 'RH/DP', 'R$', 3)
      ON CONFLICT ("id") DO NOTHING;
    `).catch(() => {});

    global.schemaEnsuredGlobal = true;
    return true;
  } catch (err: any) {
    console.error('ensureDatabaseSchema error:', err?.message || err);
    return false;
  } finally {
    try {
      await pool.end();
    } catch {}
  }
}

/**
 * Singleton Prisma client for Next.js server runtime using Prisma 7 adapter-pg.
 * Uses lazy loading to prevent build-time/module-load bundling crashes.
 */
export function getPrisma(): PrismaClient {
  const connectionString = getSanitizedDatabaseUrl();
  if (!connectionString || !isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured or does not start with postgresql:// or postgres://.');
  }

  if (global.prismaGlobal) {
    return global.prismaGlobal;
  }

  try {
    const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
    
    const { Pool } = require('pg');
    const { PrismaPg } = require('@prisma/adapter-pg');
    const { PrismaClient } = require('@prisma/client');

    if (!global.pgPoolGlobal) {
      global.pgPoolGlobal = new Pool({
        connectionString,
        ssl: isLocal ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
      });
    }

    const adapter = new PrismaPg(global.pgPoolGlobal);
    
    global.prismaGlobal = new (PrismaClient as any)({
      adapter,
      log: [], // Keep empty to avoid raw prisma:error stdout dumping
    });

    // Auto-ensure schema in background
    if (!global.schemaEnsuredGlobal) {
      ensureDatabaseSchema().catch(() => {});
    }

    return global.prismaGlobal as PrismaClient;
  } catch (err: any) {
    throw new Error(`Database client initialization failed: ${err.message}`);
  }
}

export default getPrisma;
