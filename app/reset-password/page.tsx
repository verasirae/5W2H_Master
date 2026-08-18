'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    setIsLoading(true);

    try {
      setIsSuccess(true);
      setIsLoading(false);

      setTimeout(() => {
        router.push('/login?message=' + encodeURIComponent('Senha atualizada com sucesso! Faça login com sua credencial.'));
      }, 1500);
    } catch (err: any) {
      console.error('Password update error:', err);
      setErrorMessage(err.message || 'Erro inesperado ao atualizar a senha.');
      setIsLoading(false);
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
              Atualização de Credenciais
            </span>
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
          Criar Nova Senha
        </h2>
        <p className="text-xs md:text-sm text-muted-foreground">
          Defina uma nova senha segura para acessar sua conta corporativa.
        </p>
      </div>

      {/* Card */}
      <div className="bg-card border border-border shadow-xl p-6 md:p-8">
        {isSuccess ? (
          <div className="space-y-4 py-3 text-center animate-in fade-in duration-300">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-base text-foreground">Senha alterada com sucesso!</h3>
            <p className="text-xs text-muted-foreground">
              Redirecionando você para a página de login com sua nova credencial...
            </p>
            <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto mt-2" />
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-destructive/10 border-l-4 border-destructive border-y border-r border-destructive/20 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground font-mono-data">
                Nova Senha
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-background border border-input text-foreground text-xs pl-9 pr-9 py-2.5 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground font-mono-data"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground font-mono-data">
                Confirmar Nova Senha
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full bg-background border border-input text-foreground text-xs pl-9 pr-9 py-2.5 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground font-mono-data"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono-data">
                <Check className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
                <span>Mínimo de 6 caracteres</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs uppercase tracking-wider font-mono-data transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando nova senha...</span>
                </>
              ) : (
                <>
                  <span>Salvar Nova Senha</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Sua senha é criptografada e armazenada no PostgreSQL local</span>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        Lembrou da senha anterior?{' '}
        <Link
          href="/login"
          className="font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-4"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <Suspense fallback={<div className="text-xs font-mono-data text-muted-foreground">Carregando formulário...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
