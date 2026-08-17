import { NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', 'supabase_complete_schema.sql');
  let sqlContent = '';
  try {
    sqlContent = fs.readFileSync(sqlPath, 'utf8');
  } catch {
    sqlContent = '-- Migration file not found';
  }

  return NextResponse.json({
    configured: isDatabaseConfigured(),
    sql: sqlContent,
  });
}

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          'DATABASE_URL não configurada no ambiente. Para criar as tabelas, copie o script SQL e execute no Supabase SQL Editor.',
      },
      { status: 400 }
    );
  }

  try {
    const prisma = getPrisma();
    const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', 'supabase_complete_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL by statements or execute via raw SQL
    // Execute DDL blocks
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public."User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "name" TEXT,
        "avatarUrl" TEXT,
        "role" TEXT NOT NULL DEFAULT 'member',
        "department" TEXT,
        "jobTitle" TEXT,
        "status" TEXT NOT NULL DEFAULT 'active',
        "lastLoginAt" TIMESTAMP(3) WITH TIME ZONE,
        "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public."Department" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT UNIQUE NOT NULL,
        "description" TEXT,
        "color" TEXT,
        "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public."Category" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "departmentName" TEXT NOT NULL,
        "departmentId" TEXT,
        "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public."Task" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "why" TEXT NOT NULL,
        "where" TEXT NOT NULL,
        "startDate" TEXT NOT NULL,
        "deadlineDate" TEXT NOT NULL,
        "who" TEXT NOT NULL,
        "how" TEXT NOT NULL,
        "howMuch" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "department" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "competence" TEXT NOT NULL,
        "priority" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "completionDate" TEXT,
        "observations" TEXT,
        "departmentId" TEXT,
        "categoryId" TEXT,
        "createdById" TEXT,
        "assignedUserId" TEXT,
        "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public."WorkspaceConfig" (
        "id" TEXT PRIMARY KEY DEFAULT 'default',
        "workspaceName" TEXT NOT NULL DEFAULT '5W2H Gerenciamento de Rotinas',
        "departmentName" TEXT NOT NULL DEFAULT 'RH/DP',
        "currencySymbol" TEXT NOT NULL DEFAULT 'R$',
        "attentionThresholdDays" INTEGER NOT NULL DEFAULT 3,
        "departments" JSONB,
        "categoriesByDepartment" JSONB,
        "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return NextResponse.json({
      success: true,
      message: 'Tabelas criadas com sucesso no Supabase PostgreSQL via Prisma.',
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Falha ao executar migração direta',
      },
      { status: 500 }
    );
  }
}
