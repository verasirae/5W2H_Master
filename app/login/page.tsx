'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

function LoginForm() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectPath =
    redirectParam &&
    redirectParam.startsWith('/') &&
    redirectParam !== '/login' &&
    redirectParam !== '/signup' &&
    redirectParam !== '/cadastro' &&
    redirectParam !== '/forgot-password'
      ? redirectParam
      : '/';
  const queryError = searchParams.get('error');
  const queryMessage = searchParams.get('message');

  const [errorMessage, setErrorMessage] = useState<string | null>(
    queryError ? decodeURIComponent(queryError) : null
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(
    queryMessage ? decodeURIComponent(queryMessage) : null
  );

  // Auto redirect if user is already authenticated
  useEffect(() => {
    if (!isAuthLoading && user) {
      window.location.replace(redirectPath);
    }
  }, [user, isAuthLoading, redirectPath]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('E-mail ainda não confirmado. Por favor, verifique sua caixa de entrada.');
        } else if (error.message.includes('rate limit')) {
          setErrorMessage('Muitas tentativas consecutivas. Aguarde alguns instantes e tente novamente.');
        } else {
          setErrorMessage(error.message || 'Erro ao realizar login. Tente novamente.');
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Sync user profile to database (non-blocking)
        fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || null,
            avatarUrl: data.user.user_metadata?.avatar_url || null,
          }),
        }).catch((err) => console.warn('User profile background sync:', err));

        setSuccessMessage('Login efetuado com sucesso! Redirecionando...');
        
        // Execute immediate redirect with fallback
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 200);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Ocorreu um erro inesperado ao autenticar.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);

    try {
      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        const errorMsg = error.message || '';
        if (
          errorMsg.toLowerCase().includes('unsupported provider') ||
          errorMsg.toLowerCase().includes('not enabled') ||
          errorMsg.toLowerCase().includes('validation_failed')
        ) {
          setErrorMessage(
            'O provedor de login com Google não está ativado no seu projeto Supabase. Para ativá-lo, acesse o painel do Supabase > Authentication > Providers > Google, insira seu Client ID e Client Secret do Google Cloud Console e salve. Enquanto isso, você pode criar uma conta e entrar com seu e-mail e senha normalmente.'
          );
        } else {
          setErrorMessage(error.message || 'Falha ao iniciar autenticação com o Google.');
        }
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      const errMsg = err?.message || '';
      if (
        errMsg.toLowerCase().includes('unsupported provider') ||
        errMsg.toLowerCase().includes('not enabled')
      ) {
        setErrorMessage(
          'O provedor de login com Google não está ativado no painel do Supabase (Authentication > Providers > Google).'
        );
      } else {
        setErrorMessage(errMsg || 'Erro de conexão com o provedor Google.');
      }
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-card border border-border shadow-xs mb-2">
          <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center font-bold text-sm shadow-inner">
            5
          </div>
          <div className="text-left">
            <span className="font-bold text-sm text-foreground block leading-tight">
              5W2H Master
            </span>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono-data block">
              Gestão de Rotinas & Ações
            </span>
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          Acesse sua conta
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Gerencie seus planos de ação, matrizes 5W2H e rotinas corporativas.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border shadow-xl p-6 md:p-8 relative">
        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-destructive/10 border-l-4 border-destructive border-y border-r border-destructive/20 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 bg-emerald-500/10 border-l-4 border-emerald-500 border-y border-r border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{successMessage}</div>
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading || isLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-background hover:bg-muted text-foreground border border-input hover:border-primary transition-all text-xs font-semibold uppercase tracking-wider font-mono-data cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Entrar com o Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative bg-card px-3 text-[10px] uppercase font-mono-data text-muted-foreground tracking-widest">
            Ou com e-mail e senha
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-foreground font-mono-data">
              E-mail Corporativo
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com"
                className="w-full bg-background border border-input text-foreground text-xs pl-9 pr-3 py-2.5 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground font-mono-data">
                Senha
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-background border border-input text-foreground text-xs pl-9 pr-9 py-2.5 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground font-mono-data"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                title={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 border-input bg-background accent-primary cursor-pointer"
            />
            <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
              Manter sessão conectada
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs uppercase tracking-wider font-mono-data transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Badge */}
        <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Autenticação nativa com criptografia de ponta a ponta</span>
        </div>
      </div>

      {/* Footer Register Link */}
      <div className="text-center text-xs text-muted-foreground">
        Não tem uma conta corporativa?{' '}
        <Link
          href={`/signup${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
          className="font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-4"
        >
          Criar nova conta
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden select-none">
      {/* Background Grid Pattern Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <Suspense fallback={<div className="text-xs font-mono-data text-muted-foreground">Carregando formulário...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
