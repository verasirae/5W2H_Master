'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  Clock,
  ShieldCheck,
  RefreshCw,
  LogOut,
  User,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const PendingApprovalView: React.FC = () => {
  const { user, refreshSession, signOut, getUserDisplayName } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setFeedback(null);
    try {
      await refreshSession();
      setFeedback('Status verificado.');
    } catch {
      setFeedback('Não foi possível atualizar o status agora.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-background flex flex-col items-center justify-center p-4 md:p-6 select-none relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-card border border-border shadow-2xl p-6 md:p-8 relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-background border border-border shadow-xs mb-1">
            <div className="w-6 h-6 bg-foreground text-background flex items-center justify-center font-bold text-xs">
              5
            </div>
            <span className="font-bold text-xs text-foreground tracking-tight">
              5W2H Master
            </span>
          </div>

          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>

          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
            Aguardando Aprovação de Acesso
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Seu cadastro foi realizado com sucesso, mas o seu acesso ainda está pendente de liberação por um administrador.
          </p>
        </div>

        {/* User Card */}
        <div className="p-4 bg-background border border-border space-y-2.5 font-mono-data text-xs">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Nome:
            </span>
            <span className="font-bold text-foreground">{getUserDisplayName()}</span>
          </div>

          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> E-mail:
            </span>
            <span className="text-foreground truncate max-w-[200px]">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Status Atual:
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold uppercase text-[10px] border border-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Pendente
            </span>
          </div>
        </div>

        {/* Information box */}
        <div className="p-3.5 bg-muted/60 border border-border text-xs text-muted-foreground space-y-2 leading-relaxed">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-primary shrink-0" />
            O que acontece agora?
          </p>
          <ul className="list-disc pl-5 space-y-1 text-[11px]">
            <li>Um administrador do sistema receberá sua solicitação de acesso.</li>
            <li>Ele definirá seu papel (<strong>Admin</strong>, <strong>Gestor</strong> ou <strong>Membro</strong>) e seu departamento.</li>
            <li>Assim que aprovado, seu acesso a todas as ferramentas do 5W2H será liberado imediatamente.</li>
          </ul>
        </div>

        {feedback && (
          <p className="text-center text-xs text-primary font-mono-data">{feedback}</p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
          <button
            onClick={handleCheckStatus}
            disabled={isChecking}
            className="flex-1 h-10 bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar Status'}
          </button>

          <button
            onClick={signOut}
            className="h-10 px-4 bg-background border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};
