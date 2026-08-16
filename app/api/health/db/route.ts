import { NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export async function GET() {
  const configured = isDatabaseConfigured();

  if (!configured) {
    return NextResponse.json({
      status: 'unconfigured',
      provider: 'supabase/postgresql',
      orm: 'prisma-v7',
      connected: false,
      message: 'DATABASE_URL environment variable is not defined. Add it to project settings to enable real-time Supabase synchronization.',
    });
  }

  try {
    const prisma = getPrisma();
    const taskCount = await prisma.task.count();

    return NextResponse.json({
      status: 'connected',
      provider: 'supabase/postgresql',
      orm: 'prisma-v7',
      connected: true,
      taskCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        provider: 'supabase/postgresql',
        orm: 'prisma-v7',
        connected: false,
        error: error.message || 'Connection failed',
      },
      { status: 500 }
    );
  }
}
