import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, department, jobTitle } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const prisma = getPrisma();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' },
        { status: 400 }
      );
    }

    const passwordHash = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        name: name?.trim() || cleanEmail.split('@')[0],
        passwordHash,
        provider: 'local',
        role: 'member',
        department: department || null,
        jobTitle: jobTitle || null,
        status: 'active',
        lastLoginAt: new Date(),
      },
    });

    const token = createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
      department: newUser.department,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatarUrl: newUser.avatarUrl,
        role: newUser.role,
        department: newUser.department,
        jobTitle: newUser.jobTitle,
        provider: newUser.provider,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
