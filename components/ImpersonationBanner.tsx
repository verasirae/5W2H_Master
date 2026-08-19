'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { ShieldAlert, LogOut, Loader2, User } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, impersonatedFrom, user, stopImpersonation } = useAuth();
  const [isStopping, setIsStopping] = useState(false);

  if (!isImpersonating || !user) return null;

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await stopImpersonation();
      window.location.reload();
    } catch {
      setIsStopping(false);
    }
  };

  const roleLabel =
    user.role === 'admin'
      ? 'Administrador'
      : user.role === 'gestor'
      ? 'Gestor'
      : 'Membro';

  return (
    <div className="w-full bg-amber-500 text-slate-950 px-4 py-2 text-xs font-mono-data flex flex-wrap items-center justify-between gap-3 shadow-md z-50 border-b border-amber-600">
      <div className="flex items-center gap-2 font-medium">
        <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0 animate-bounce" />
        <span>
          <strong>MODO IMPERSONAÇÃO ATIVO:</strong> Você está visualizando o sistema como{' '}
          <strong className="underline font-bold text-slate-900">
            {user.name || user.email}
          </strong>{' '}
          (Papel: <span className="uppercase font-bold">{roleLabel}</span>
          {user.department ? ` • Dept: ${user.department}` : ''})
        </span>
        {impersonatedFrom && (
          <span className="hidden md:inline text-slate-900 opacity-80 ml-2">
            | Sessão original: Admin ({impersonatedFrom.email})
          </span>
        )}
      </div>

      <button
        onClick={handleStop}
        disabled={isStopping}
        className="px-3 py-1 bg-slate-950 text-white hover:bg-slate-900 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
      >
        {isStopping ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <LogOut className="w-3 h-3" />
        )}
        Encerrar Impersonação
      </button>
    </div>
  );
};
