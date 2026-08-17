import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      message: 'DATABASE_URL not configured. Running in client-storage mode.',
      users: [],
    });
  }

  try {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        department: true,
        jobTitle: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tasksCreated: true,
            tasksAssigned: true,
          },
        },
      },
    });

    return NextResponse.json({
      connected: true,
      users: users.map((u) => ({
        ...u,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Failed to query users table',
        users: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { connected: false, message: 'DATABASE_URL not configured.' },
      { status: 400 }
    );
  }

  try {
    const prisma = getPrisma();
    const body = await req.json();

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const userId = body.id || (globalThis.crypto ? crypto.randomUUID() : `usr_${Date.now()}`);

    const user = await prisma.user.upsert({
      where: { email: body.email },
      update: {
        name: body.name ?? undefined,
        avatarUrl: body.avatarUrl ?? undefined,
        role: body.role ?? undefined,
        department: body.department ?? undefined,
        jobTitle: body.jobTitle ?? undefined,
        status: body.status ?? undefined,
        lastLoginAt: body.lastLoginAt ? new Date(body.lastLoginAt) : undefined,
      },
      create: {
        id: userId,
        email: body.email,
        name: body.name || null,
        avatarUrl: body.avatarUrl || null,
        role: body.role || 'member',
        department: body.department || null,
        jobTitle: body.jobTitle || null,
        status: body.status || 'active',
        lastLoginAt: body.lastLoginAt ? new Date(body.lastLoginAt) : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error upserting user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save user' },
      { status: 500 }
    );
  }
}
