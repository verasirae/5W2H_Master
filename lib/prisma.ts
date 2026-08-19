import type { PrismaClient } from '@prisma/client';
import type { Pool } from 'pg';

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
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

    return global.prismaGlobal as PrismaClient;
  } catch (err: any) {
    throw new Error(`Database client initialization failed: ${err.message}`);
  }
}

export default getPrisma;
