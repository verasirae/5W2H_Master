import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
}

export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url && url.trim() !== '' && !url.includes('MY_') && !url.includes('[YOUR-'));
}

export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured or contains placeholder credentials.');
  }

  if (process.env.NODE_ENV === 'production') {
    const pool = new Pool({ connectionString, max: 10 });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  if (!global.prismaGlobal) {
    if (!global.pgPoolGlobal) {
      global.pgPoolGlobal = new Pool({ connectionString, max: 10 });
    }
    const adapter = new PrismaPg(global.pgPoolGlobal);
    global.prismaGlobal = new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    });
  }

  return global.prismaGlobal;
}
