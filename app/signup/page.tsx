'use client';

import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/supabase/auth-context';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

function SignupForm() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successState, setSuccessState] = useState<boolean>(false);
  const [isEmailConfirmationPending, setIsEmailConfirmationPending] = useState<boolean>(false);

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

  // Auto redirect if user is already authenticated
  useEffect(() => {
    if (!isAuthLoading && user) {
      window.location.replace(redirectPath);
    }
  }, [user, isAuthLoading, redirectPath]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('A senha deve conter no mínimo 8 caracteres para maior segurança.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação de senha não coincide com a senha digitada.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
          },
          emailRedirectTo: callbackUrl,
        },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          setErrorMessage('Este e-mail já está cadastrado. Faça login ou recupere sua senha.');
        } else if (error.message.includes('Password should be')) {
          setErrorMessage('A senha fornecida não atende aos requisitos de complexidade.');
        } else {
          setErrorMessage(error.message || 'Erro ao registrar nova conta.');
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
            name: fullName.trim(),
          }),
        }).catch((err) => console.warn('User profile background sync:', err));
      }

      // Check if email confirmation is required or session was created directly
      if (data.session) {
        setSuccessState(true);
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 300);
      } else if (data.user && !data.session) {
        // Confirmation email sent
        setIsEmailConfirmationPending(true);
        setSuccessState(true);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setErrorMessage(err.message || 'Ocorreu um erro inesperado durante o cadastro.');
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
          setErrorMessage(error.message || 'Falha ao iniciar cadastro via Google.');
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
          Criar conta corporativa
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Comece a estruturar seus planos de ação e equipes com o método 5W2H.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-card border border-border shadow-xl p-6 md:p-8 relative">
        {/* Success Confirmation Mode */}
        {successState && isEmailConfirmationPending ? (
          <div className="space-y-4 py-2 animate-in fade-in duration-300">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Conta criada com sucesso!</h3>
                <p className="text-xs mt-1 text-muted-foreground leading-relaxed">
                  Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>. 
                  Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider font-mono-data transition-colors"
              >
                <span>Ir para a tela de Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : successState ? (
          <div className="space-y-4 py-4 text-center animate-in fade-in duration-300">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-sm text-foreground">Conta registrada e ativada!</h3>
            <p className="text-xs text-muted-foreground">Redirecionando para seu workspace...</p>
            <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <>
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-destructive/10 border-l-4 border-destructive border-y border-r border-destructive/20 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Google Signup Button */}
            <button
              type="button"
              onClick={handleGoogleSignup}
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
              <span>Cadastrar com o Google</span>
            </button>

            {/* Divider */}
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <span className="relative bg-card px-3 text-[10px] uppercase font-mono-data text-muted-foreground tracking-widest">
                Ou preencha o formulário
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground font-mono-data">
                  Nome Completo
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: João da Silva"
                    className="w-full bg-background border border-input text-foreground text-xs pl-9 pr-3 py-2.5 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground"
                  />
                </div>
              </div>

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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground font-mono-data">
                    Senha
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mín. 8 dígitos"
                      className="w-full bg-background border border-input text-foreground text-xs pl-9 pr-8 py-2.5 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground font-mono-data"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-foreground font-mono-data">
                    Confirmar Senha
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full bg-background border border-input text-foreground text-xs pl-9 pr-8 py-2.5 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground font-mono-data"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password strength indicator */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono-data">
                  <Check className={`w-3.5 h-3.5 ${password.length >= 8 ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
                  <span>Mínimo de 8 caracteres</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs uppercase tracking-wider font-mono-data transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando sua conta...</span>
                  </>
                ) : (
                  <>
                    <span>Finalizar Cadastro</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Seus dados são protegidos por políticas RLS e SSL</span>
            </div>
          </>
        )}
      </div>

      {/* Footer Login Link */}
      <div className="text-center text-xs text-muted-foreground">
        Já possui uma conta corporativa?{' '}
        <Link
          href={`/login${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
          className="font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-4"
        >
          Acessar conta existente
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <Suspense fallback={<div className="text-xs font-mono-data text-muted-foreground">Carregando formulário...</div>}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
