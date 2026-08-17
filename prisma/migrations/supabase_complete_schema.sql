-- ==============================================================================
-- 5W2H MASTER - ESQUEMA COMPLETO PARA O SUPABASE POSTGRESQL
-- Copie e cole este script diretamente no Supabase SQL Editor (SQL Editor > New Query > Run)
-- ==============================================================================

-- 1. TABELA DE USUÁRIOS (Sincronizada com o Supabase Auth)
CREATE TABLE IF NOT EXISTS public."User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "avatarUrl" TEXT,
  "role" TEXT NOT NULL DEFAULT 'member', -- 'admin', 'manager', 'member', 'viewer'
  "department" TEXT,
  "jobTitle" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'pending'
  "lastLoginAt" TIMESTAMP(3) WITH TIME ZONE,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON public."User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON public."User"("role");
CREATE INDEX IF NOT EXISTS "User_department_idx" ON public."User"("department");

-- 2. TABELA DE DEPARTAMENTOS
CREATE TABLE IF NOT EXISTS public."Department" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT UNIQUE NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABELA DE CATEGORIAS
CREATE TABLE IF NOT EXISTS public."Category" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "departmentName" TEXT NOT NULL,
  "departmentId" TEXT REFERENCES public."Department"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_name_departmentName_key" UNIQUE ("name", "departmentName")
);

CREATE INDEX IF NOT EXISTS "Category_departmentName_idx" ON public."Category"("departmentName");

-- 4. TABELA DE TAREFAS (5W2H)
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
  "departmentId" TEXT REFERENCES public."Department"("id") ON DELETE SET NULL,
  "categoryId" TEXT REFERENCES public."Category"("id") ON DELETE SET NULL,
  "createdById" TEXT REFERENCES public."User"("id") ON DELETE SET NULL,
  "assignedUserId" TEXT REFERENCES public."User"("id") ON DELETE SET NULL,
  "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "Task_department_idx" ON public."Task"("department");
CREATE INDEX IF NOT EXISTS "Task_category_idx" ON public."Task"("category");
CREATE INDEX IF NOT EXISTS "Task_status_idx" ON public."Task"("status");
CREATE INDEX IF NOT EXISTS "Task_deadlineDate_idx" ON public."Task"("deadlineDate");
CREATE INDEX IF NOT EXISTS "Task_competence_idx" ON public."Task"("competence");
CREATE INDEX IF NOT EXISTS "Task_who_idx" ON public."Task"("who");
CREATE INDEX IF NOT EXISTS "Task_priority_idx" ON public."Task"("priority");
CREATE INDEX IF NOT EXISTS "Task_createdById_idx" ON public."Task"("createdById");
CREATE INDEX IF NOT EXISTS "Task_assignedUserId_idx" ON public."Task"("assignedUserId");

-- 5. TABELA DE CONFIGURAÇÃO DO WORKSPACE
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

-- Inserir configuração padrão inicial se não existir
INSERT INTO public."WorkspaceConfig" ("id", "workspaceName", "departmentName", "currencySymbol", "attentionThresholdDays")
VALUES ('default', '5W2H Gerenciamento de Rotinas', 'RH/DP', 'R$', 3)
ON CONFLICT ("id") DO NOTHING;

-- 6. GATILHO AUTOMÁTICO PARA CRIAR USUÁRIO AO CADASTRAR NO SUPABASE AUTH
-- Esta função escuta a tabela auth.users do Supabase e sincroniza automaticamente com public.User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public."User" ("id", "email", "name", "avatarUrl", "role", "lastLoginAt")
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    'member',
    NOW()
  )
  ON CONFLICT ("email") DO UPDATE SET
    "id" = EXCLUDED."id",
    "name" = COALESCE(EXCLUDED."name", public."User"."name"),
    "avatarUrl" = COALESCE(EXCLUDED."avatarUrl", public."User"."avatarUrl"),
    "lastLoginAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativar trigger na tabela auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. HABILITAR ROW LEVEL SECURITY (RLS) COM PERMISSÕES PÚBLICAS/AUTENTICADAS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Department" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WorkspaceConfig" ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Allow all for authenticated and service" ON public."User";
CREATE POLICY "Allow all for authenticated and service" ON public."User"
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated and service" ON public."Task";
CREATE POLICY "Allow all for authenticated and service" ON public."Task"
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated and service" ON public."Department";
CREATE POLICY "Allow all for authenticated and service" ON public."Department"
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated and service" ON public."Category";
CREATE POLICY "Allow all for authenticated and service" ON public."Category"
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated and service" ON public."WorkspaceConfig";
CREATE POLICY "Allow all for authenticated and service" ON public."WorkspaceConfig"
  FOR ALL USING (true) WITH CHECK (true);
