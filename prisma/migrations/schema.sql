-- 5W2H Master - Schema Completo para PostgreSQL Local

-- 1. Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Usuários (Autenticação Local + Google OAuth)
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "avatarUrl" TEXT,
  "passwordHash" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'local',
  "googleId" TEXT,
  "role" TEXT NOT NULL DEFAULT 'member',
  "department" TEXT,
  "jobTitle" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Garantir colunas caso a tabela já existisse
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'member';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_department_idx" ON "User"("department");

-- 3. Tabela de Departamentos
CREATE TABLE IF NOT EXISTS "Department" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Categorias
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT NOT NULL,
  "departmentName" TEXT NOT NULL,
  "departmentId" TEXT REFERENCES "Department"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_name_departmentName_key" UNIQUE ("name", "departmentName")
);

CREATE INDEX IF NOT EXISTS "Category_departmentName_idx" ON "Category"("departmentName");

-- 5. Tabela de Tarefas (5W2H)
CREATE TABLE IF NOT EXISTS "Task" (
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
  "departmentId" TEXT REFERENCES "Department"("id") ON DELETE SET NULL,
  "categoryId" TEXT REFERENCES "Category"("id") ON DELETE SET NULL,
  "createdById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "assignedUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Garantir colunas em Task caso a tabela já existisse
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "createdById" TEXT REFERENCES "User"("id") ON DELETE SET NULL;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Task_department_idx" ON "Task"("department");
CREATE INDEX IF NOT EXISTS "Task_category_idx" ON "Task"("category");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON "Task"("status");
CREATE INDEX IF NOT EXISTS "Task_deadlineDate_idx" ON "Task"("deadlineDate");
CREATE INDEX IF NOT EXISTS "Task_competence_idx" ON "Task"("competence");
CREATE INDEX IF NOT EXISTS "Task_who_idx" ON "Task"("who");
CREATE INDEX IF NOT EXISTS "Task_priority_idx" ON "Task"("priority");
CREATE INDEX IF NOT EXISTS "Task_createdById_idx" ON "Task"("createdById");
CREATE INDEX IF NOT EXISTS "Task_assignedUserId_idx" ON "Task"("assignedUserId");

-- 6. Tabela de Configurações de Workspace
CREATE TABLE IF NOT EXISTS "WorkspaceConfig" (
  "id" TEXT PRIMARY KEY DEFAULT 'default',
  "workspaceName" TEXT NOT NULL DEFAULT '5W2H Gerenciamento de Rotinas',
  "departmentName" TEXT NOT NULL DEFAULT 'RH/DP',
  "currencySymbol" TEXT NOT NULL DEFAULT 'R$',
  "attentionThresholdDays" INTEGER NOT NULL DEFAULT 3,
  "departments" JSONB,
  "categoriesByDepartment" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Inserir departamentos padrão caso não existam
INSERT INTO "Department" ("id", "name", "description", "color", "createdAt", "updatedAt")
VALUES 
  ('dept-rh', 'RH/DP', 'Recursos Humanos e Departamento Pessoal', 'indigo', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dept-ops', 'Operações', 'Logística, Produção e Suprimentos', 'emerald', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dept-ti', 'TI / Tecnologia', 'Sistemas, Infraestrutura e Segurança', 'sky', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dept-fin', 'Financeiro / Controladoria', 'Contabilidade, Tesouraria e Fiscal', 'amber', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "WorkspaceConfig" ("id", "workspaceName", "departmentName", "currencySymbol", "attentionThresholdDays", "createdAt", "updatedAt")
VALUES ('default', '5W2H Gerenciamento de Rotinas', 'RH/DP', 'R$', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
