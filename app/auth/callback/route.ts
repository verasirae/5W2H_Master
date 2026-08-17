import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    } else {
      console.error('Error exchanging OAuth code for session:', error.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message || 'Falha na autenticação.')}`
      );
    }
  }

  // If no code provided or error, redirect to login
  return NextResponse.redirect(`${origin}/login?error=Nenhum+c%C3%B3digo+de+autentica%C3%A7%C3%A3o+encontrado.`);
}
