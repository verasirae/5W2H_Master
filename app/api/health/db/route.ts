import { NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured, isDatabaseTemporarilyUnreachable, markDatabaseUnreachable } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isDatabaseConfigured() && !isDatabaseTemporarilyUnreachable();

  if (!configured) {
    return NextResponse.json({
      status: 'unconfigured',
      provider: 'postgresql-local',
      orm: 'prisma-v7',
      connected: false,
      message: 'DATABASE_URL não configurada ou inacessível no ambiente. Operando com armazenamento local.',
    });
  }

  try {
    const prisma = getPrisma();
    const taskCount = await prisma.task.count();

    return NextResponse.json({
      status: 'connected',
      provider: 'postgresql-local',
      orm: 'prisma-v7',
      connected: true,
      taskCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    markDatabaseUnreachable();
    return NextResponse.json(
      {
        status: 'offline',
        provider: 'postgresql-local',
        orm: 'prisma-v7',
        connected: false,
        message: 'Servidor de banco de dados offline ou inacessível.',
        error: error.message || 'Connection failed',
      },
      { status: 200 }
    );
  }
}
