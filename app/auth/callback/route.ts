import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(
      `<html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${error}' }, '*');
          window.close();
        } else {
          window.location.href = '/login?error=${encodeURIComponent(error)}';
        }
      </script><p>Erro de autenticação: ${error}</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  if (!code) {
    return new NextResponse(
      `<html><body><script>
        if (window.opener) {
          window.close();
        } else {
          window.location.href = '/login';
        }
      </script><p>Nenhum código de autorização recebido.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }

  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET;
  const appUrl = process.env.APP_URL || origin;
  const redirectUri = `${appUrl}/auth/callback`;

  try {
    // 1. Exchange code for access_token and id_token with Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId || '',
        client_secret: clientSecret || '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Google token exchange error:', tokenData);
      const errMsg = tokenData.error_description || tokenData.error || 'Falha ao validar com Google';
      return new NextResponse(
        `<html><body><script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${errMsg}' }, '*');
            window.close();
          } else {
            window.location.href = '/login?error=${encodeURIComponent(errMsg)}';
          }
        </script><p>Erro: ${errMsg}</p></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // 2. Fetch User Profile from Google
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const googleUser = await userInfoRes.json();

    if (!googleUser.email) {
      throw new Error('Não foi possível obter o e-mail da conta do Google');
    }

    const email = googleUser.email.toLowerCase();
    const name = googleUser.name || googleUser.given_name || email.split('@')[0];
    const avatarUrl = googleUser.picture || null;
    const googleId = googleUser.sub || null;

    // 3. Upsert user in Local PostgreSQL
    const prisma = getPrisma();
    let dbUser = await prisma.user.findUnique({
      where: { email },
    });

    if (dbUser) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          name: name || dbUser.name,
          avatarUrl: avatarUrl || dbUser.avatarUrl,
          googleId: googleId || dbUser.googleId,
          lastLoginAt: new Date(),
        },
      });
    } else {
      dbUser = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl,
          googleId,
          provider: 'google',
          role: 'member',
          status: 'active',
          lastLoginAt: new Date(),
        },
      });
    }

    // 4. Create local session token
    const sessionToken = createSessionToken({
      userId: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      avatarUrl: dbUser.avatarUrl,
      department: dbUser.department,
    });

    // 5. Return success HTML with postMessage and cookie
    const response = new NextResponse(
      `<html>
        <head><title>Autenticação Concluída</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc;">
          <div style="text-align: center; padding: 20px;">
            <h2 style="margin-bottom: 10px;">Autenticado com sucesso!</h2>
            <p style="color: #94a3b8;">Fechando janela de conexão...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (err: any) {
    console.error('Callback error:', err);
    return new NextResponse(
      `<html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'OAUTH_AUTH_ERROR', error: '${err.message}' }, '*');
          window.close();
        } else {
          window.location.href = '/login?error=${encodeURIComponent(err.message)}';
        }
      </script><p>Erro durante o processo de login: ${err.message}</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}
