import { NextRequest, NextResponse } from 'next/server';
import { getPrisma, isDatabaseConfigured } from '@/lib/prisma';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!isDatabaseConfigured()) {
      // In offline/unconfigured database mode, allow demo login for standard accounts
      if (
        cleanEmail === 'admin@5w2h.local' ||
        cleanEmail === 'iraeveras@outlook.com.br' ||
        cleanEmail === 'membro@5w2h.local'
      ) {
        const isIrae = cleanEmail.includes('irae');
        const isMember = cleanEmail.startsWith('membro');
        const token = createSessionToken({
          userId: isIrae ? 'usr-irae-veras' : isMember ? 'usr-member-demo' : 'usr-admin-demo',
          email: cleanEmail,
          name: isIrae ? 'Irae Veras' : isMember ? 'Membro da Equipe' : 'Administrador 5W2H',
          role: isMember ? 'member' : 'admin',
          avatarUrl: null,
          department: isMember ? 'Operações' : 'RH/DP',
        });

        const response = NextResponse.json({
          success: true,
          user: {
            id: isIrae ? 'usr-irae-veras' : isMember ? 'usr-member-demo' : 'usr-admin-demo',
            email: cleanEmail,
            name: isIrae ? 'Irae Veras' : isMember ? 'Membro da Equipe' : 'Administrador 5W2H',
            role: isMember ? 'member' : 'admin',
            department: isMember ? 'Operações' : 'RH/DP',
            provider: 'local',
          },
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
        return response;
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Banco de dados PostgreSQL não conectado. Use as contas padrão (admin@5w2h.local ou iraeveras@outlook.com.br) ou configure a conexão.',
        },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado. Verifique seu e-mail ou cadastre-se.' },
        { status: 401 }
      );
    }

    if (user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Senha incorreta. Tente novamente.' },
          { status: 401 }
        );
      }
    } else if (user.provider === 'google') {
      return NextResponse.json(
        {
          success: false,
          error: 'Esta conta foi criada com o Google. Por favor, use o botão "Entrar com Google".',
        },
        { status: 400 }
      );
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    const token = createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      department: user.department,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        provider: user.provider,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar login' },
      { status: 500 }
    );
  }
}
