-- SQL Migration for 5W2H Master - Users Table
-- Can be executed in Supabase SQL Editor or direct PostgreSQL client

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "name" TEXT,
  "avatarUrl" TEXT,
  "role" TEXT NOT NULL DEFAULT 'member',
  "department" TEXT,
  "jobTitle" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_department_idx" ON "User"("department");

-- Add foreign key columns to Task table if they don't already exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Task' AND column_name='createdById') THEN
    ALTER TABLE "Task" ADD COLUMN "createdById" TEXT;
    CREATE INDEX IF NOT EXISTS "Task_createdById_idx" ON "Task"("createdById");
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Task' AND column_name='assignedUserId') THEN
    ALTER TABLE "Task" ADD COLUMN "assignedUserId" TEXT;
    CREATE INDEX IF NOT EXISTS "Task_assignedUserId_idx" ON "Task"("assignedUserId");
  END IF;
END $$;
