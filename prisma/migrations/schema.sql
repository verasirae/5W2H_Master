-- 5W2H Master - Schema Completo com RBAC para PostgreSQL Local

-- 1. Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Usuários (Autenticação Local + Google OAuth + RBAC)
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "avatarUrl" TEXT,
  "passwordHash" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'local',
  "googleId" TEXT,
  "role" TEXT NOT NULL DEFAULT 'membro', -- 'admin', 'gestor', 'membro'
  "department" TEXT,
  "jobTitle" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'ativo', 'inativo'
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Garantir colunas caso a tabela já existisse
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'membro';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_status_idx" ON "User"("status");
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

-- 4. Tabela de Equipes (vinculadas a um Departamento)
CREATE TABLE IF NOT EXISTS "Team" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "departmentId" TEXT NOT NULL REFERENCES "Department"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Team_name_departmentId_key" UNIQUE ("name", "departmentId")
);

CREATE INDEX IF NOT EXISTS "Team_departmentId_idx" ON "Team"("departmentId");

-- 5. Tabelas de Junção / Associação (Muitos-para-Muitos)

-- Gestor <-> Departamentos (gestor_departamentos)
CREATE TABLE IF NOT EXISTS "ManagerDepartment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "departmentId" TEXT NOT NULL REFERENCES "Department"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManagerDepartment_userId_departmentId_key" UNIQUE ("userId", "departmentId")
);

CREATE INDEX IF NOT EXISTS "ManagerDepartment_userId_idx" ON "ManagerDepartment"("userId");
CREATE INDEX IF NOT EXISTS "ManagerDepartment_departmentId_idx" ON "ManagerDepartment"("departmentId");

-- Gestor <-> Equipes (gestor_equipes)
CREATE TABLE IF NOT EXISTS "ManagerTeam" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "teamId" TEXT NOT NULL REFERENCES "Team"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ManagerTeam_userId_teamId_key" UNIQUE ("userId", "teamId")
);

CREATE INDEX IF NOT EXISTS "ManagerTeam_userId_idx" ON "ManagerTeam"("userId");
CREATE INDEX IF NOT EXISTS "ManagerTeam_teamId_idx" ON "ManagerTeam"("teamId");

-- Membro <-> Departamentos (membro_departamentos)
CREATE TABLE IF NOT EXISTS "MemberDepartment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "departmentId" TEXT NOT NULL REFERENCES "Department"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemberDepartment_userId_departmentId_key" UNIQUE ("userId", "departmentId")
);

CREATE INDEX IF NOT EXISTS "MemberDepartment_userId_idx" ON "MemberDepartment"("userId");
CREATE INDEX IF NOT EXISTS "MemberDepartment_departmentId_idx" ON "MemberDepartment"("departmentId");

-- Membro <-> Equipes (membro_equipes)
CREATE TABLE IF NOT EXISTS "MemberTeam" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "teamId" TEXT NOT NULL REFERENCES "Team"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemberTeam_userId_teamId_key" UNIQUE ("userId", "teamId")
);

CREATE INDEX IF NOT EXISTS "MemberTeam_userId_idx" ON "MemberTeam"("userId");
CREATE INDEX IF NOT EXISTS "MemberTeam_teamId_idx" ON "MemberTeam"("teamId");

-- 6. Tabela de Categorias
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

-- 7. Tabela de Tarefas (5W2H)
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
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "listId" TEXT;

-- 8. Tabela de Grupos de Tarefas
CREATE TABLE IF NOT EXISTS "TaskGroup" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TaskGroup_ownerId_idx" ON "TaskGroup"("ownerId");

-- 9. Tabela de Listas de Tarefas (Pertence a um Grupo)
CREATE TABLE IF NOT EXISTS "TaskList" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "groupId" TEXT NOT NULL REFERENCES "TaskGroup"("id") ON DELETE CASCADE,
  "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TaskList_groupId_idx" ON "TaskList"("groupId");
CREATE INDEX IF NOT EXISTS "TaskList_ownerId_idx" ON "TaskList"("ownerId");

-- Chave estrangeira de Task -> TaskList
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'Task_listId_fkey'
  ) THEN
    ALTER TABLE "Task" ADD CONSTRAINT "Task_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TaskList"("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Task_listId_idx" ON "Task"("listId");

-- 10. Membros da Lista (Proprietário e Membros Convidados que aceitaram)
CREATE TABLE IF NOT EXISTS "TaskListMember" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "listId" TEXT NOT NULL REFERENCES "TaskList"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'member', -- 'owner', 'member'
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TaskListMember_listId_userId_key" UNIQUE ("listId", "userId")
);

CREATE INDEX IF NOT EXISTS "TaskListMember_listId_idx" ON "TaskListMember"("listId");
CREATE INDEX IF NOT EXISTS "TaskListMember_userId_idx" ON "TaskListMember"("userId");

-- 11. Convites para Lista de Tarefas
CREATE TABLE IF NOT EXISTS "TaskListInvite" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "listId" TEXT NOT NULL REFERENCES "TaskList"("id") ON DELETE CASCADE,
  "inviterId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "inviteeId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'aceito', 'recusado'
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "TaskListInvite_listId_idx" ON "TaskListInvite"("listId");
CREATE INDEX IF NOT EXISTS "TaskListInvite_inviterId_idx" ON "TaskListInvite"("inviterId");
CREATE INDEX IF NOT EXISTS "TaskListInvite_inviteeId_idx" ON "TaskListInvite"("inviteeId");
CREATE INDEX IF NOT EXISTS "TaskListInvite_status_idx" ON "TaskListInvite"("status");

-- 12. Notificações do Sistema e Convites
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL DEFAULT 'list_invite', -- 'list_invite', 'info', 'system'
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB,
  "isRead" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

-- 13. Tabela de Configurações de Workspace
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
