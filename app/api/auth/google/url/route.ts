import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      {
        error:
          'GOOGLE_CLIENT_ID não está configurada no ambiente. Configure as credenciais do Google OAuth no console do Google Cloud.',
      },
      { status: 400 }
    );
  }

  // Construct redirect_uri
  const origin = req.nextUrl.origin;
  const appUrl = process.env.APP_URL || origin;
  const redirectUri = `${appUrl}/auth/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return NextResponse.json({ url: authUrl });
}
