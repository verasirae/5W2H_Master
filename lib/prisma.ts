import type { PrismaClient } from '@prisma/client';

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

/**
 * Checks if the DATABASE_URL environment variable is provided, valid, and not a placeholder.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url || typeof url !== 'string') return false;
  
  const trimmed = url.trim();
  if (trimmed === '') return false;

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
 * Singleton Prisma client for Next.js server runtime.
 * Uses lazy loading to prevent build-time/module-load bundling crashes.
 */
export function getPrisma(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || !isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured or does not start with postgresql:// or postgres://.');
  }

  if (global.prismaGlobal) {
    return global.prismaGlobal;
  }

  try {
    const { PrismaClient: PrismaClientConstructor } = require('@prisma/client');
    global.prismaGlobal = new PrismaClientConstructor({
      datasources: {
        db: {
          url: connectionString.trim(),
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

    return global.prismaGlobal as PrismaClient;
  } catch (err: any) {
    console.error('Failed to initialize Prisma client:', err);
    throw new Error(`Database client initialization failed: ${err.message}`);
  }
}

export default getPrisma;


