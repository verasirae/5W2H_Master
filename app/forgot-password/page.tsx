'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail corporativo.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          setErrorMessage('Muitas solicitações em sequência. Aguarde alguns instantes antes de tentar novamente.');
        } else {
          setErrorMessage(error.message || 'Não foi possível enviar o e-mail de recuperação.');
        }
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao processar sua solicitação.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
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
                Recuperação de Acesso
              </span>
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Redefinir sua senha
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Informe seu e-mail para receber as instruções de redefinição de acesso.
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border shadow-xl p-6 md:p-8">
          {isSuccess ? (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="p-4 bg-emerald-500/10 border-l-4 border-emerald-500 border-y border-r border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="font-bold text-sm">Link de recuperação enviado!</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Caso exista uma conta associada a <strong className="text-foreground">{email}</strong>,
                    enviamos um link com instruções para redefinir sua senha com segurança.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted/40 border border-border text-xs text-muted-foreground font-mono-data space-y-1">
                <p className="font-bold text-foreground">Dica:</p>
                <p>Verifique sua caixa de spam ou lixo eletrônico caso não visualize o e-mail em alguns minutos.</p>
              </div>

              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs uppercase tracking-wider font-mono-data transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para o Login</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="p-3.5 bg-destructive/10 border-l-4 border-destructive border-y border-r border-destructive/20 text-destructive text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-foreground font-mono-data">
                  E-mail de Cadastro
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs uppercase tracking-wider font-mono-data transition-all cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando link...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Enviar Link de Recuperação</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-border flex items-center justify-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para tela de login</span>
                </Link>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Link seguro com validade de uso único</span>
          </div>
        </div>
      </div>
    </div>
  );
}
