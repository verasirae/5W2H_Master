import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
}

/**
 * Checks if the DATABASE_URL environment variable is provided and not a placeholder.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(
    url &&
      url.trim() !== '' &&
      !url.includes('MY_') &&
      !url.includes('your-password') &&
      !url.includes('your-project-ref') &&
      !url.includes('[YOUR-')
  );
}

/**
 * Singleton Prisma client for Next.js server runtime using Prisma 7 Pg adapter.
 */
export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured or contains placeholder credentials.');
  }

  // Reuse existing pool in dev/prod if already created
  if (!global.pgPoolGlobal) {
    global.pgPoolGlobal = new Pool({
      connectionString,
      max: process.env.NODE_ENV === 'production' ? 10 : 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  if (!global.prismaGlobal) {
    const adapter = new PrismaPg(global.pgPoolGlobal);
    global.prismaGlobal = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  return global.prismaGlobal;
}

export default getPrisma;
