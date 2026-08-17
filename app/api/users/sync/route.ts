import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      connected: false,
      synced: false,
      message: 'Database not connected. User state held in client session.',
    });
  }

  try {
    const body = await req.json();
    const { id, email, name, avatarUrl, department, role, jobTitle } = body;

    if (!email || !id) {
      return NextResponse.json(
        { error: 'id and email are required to sync user profile' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();

    const user = await prisma.user.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {
        id, // Ensure id matches Supabase Auth UID
        name: name || undefined,
        avatarUrl: avatarUrl || undefined,
        lastLoginAt: new Date(),
      },
      create: {
        id,
        email: email.trim().toLowerCase(),
        name: name || null,
        avatarUrl: avatarUrl || null,
        department: department || null,
        role: role || 'member',
        jobTitle: jobTitle || null,
        status: 'active',
        lastLoginAt: new Date(),
      },
    });

    return NextResponse.json({
      connected: true,
      synced: true,
      user: {
        ...user,
        lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error syncing user profile:', error);
    return NextResponse.json(
      { connected: false, error: error.message || 'Failed to sync user profile' },
      { status: 500 }
    );
  }
}
