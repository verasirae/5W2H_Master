'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { safeFetchJson } from '@/lib/utils';

export type UserRole = 'admin' | 'gestor' | 'membro';
export type UserStatus = 'pendente' | 'ativo' | 'inativo';

export interface ImpersonationInfo {
  userId: string;
  email: string;
  name?: string | null;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  status: UserStatus;
  department?: string | null;
  jobTitle?: string | null;
  provider?: string;
  managedDepartments?: string[];
  managedTeams?: string[];
  memberDepartments?: string[];
  memberTeams?: string[];
  impersonatedFrom?: ImpersonationInfo | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isConfigured: boolean;
  isImpersonating: boolean;
  impersonatedFrom: ImpersonationInfo | null;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  impersonateUser: (targetUserId: string) => Promise<{ success: boolean; error?: string }>;
  stopImpersonation: () => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  getUserInitials: () => string;
  getUserDisplayName: () => string;
  isAdmin: boolean;
  isManager: boolean;
  isMember: boolean;
  isPending: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const { ok, data } = await safeFetchJson(res);
      if (ok && data?.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initSession = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const { ok, data } = await safeFetchJson(res);
        if (!isMounted) return;
        if (ok && data?.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for OAuth message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        refreshSession().then(() => {
          window.location.replace('/');
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [refreshSession]);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const { ok, data, error } = await safeFetchJson(res);
      if (ok && data?.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data?.error || error || 'Credenciais inválidas' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao conectar ao servidor' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const { ok, data, error } = await safeFetchJson(res);
      if (ok && data?.success && data.user) {
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: data?.error || error || 'Erro ao criar conta' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Erro ao conectar ao servidor' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { ok, data, error } = await safeFetchJson(res);
      if (!ok || !data?.url) {
        throw new Error(data?.error || error || 'Falha ao obter URL de autenticação do Google');
      }
      const url = data.url;
      
      const authWindow = window.open(
        url,
        'google_oauth_popup',
        'width=600,height=700,status=no,resizable=yes,scrollbars=yes'
      );
      
      if (!authWindow) {
        // Fallback to direct redirect if popup is blocked
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  const impersonateUser = async (targetUserId: string) => {
    try {
      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      });
      const { ok, data, error } = await safeFetchJson(res);
      if (ok && data?.success && data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data?.error || error || 'Falha ao impersonar usuário' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao conectar ao servidor' };
    }
  };

  const stopImpersonation = async () => {
    try {
      const res = await fetch('/api/auth/impersonate/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { ok, data, error } = await safeFetchJson(res);
      if (ok && data?.success && data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data?.error || error || 'Falha ao encerrar impersonação' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Erro ao conectar ao servidor' };
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setUser(null);
      setIsLoading(false);
      try {
        localStorage.removeItem('5w2h_session');
        localStorage.removeItem('5w2h_auth_user');
        sessionStorage.clear();
      } catch {}
      window.location.href = '/login';
    }
  };

  const getUserDisplayName = (): string => {
    if (!user) return 'Convidado';
    if (user.name) return user.name;
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Usuário';
  };

  const getUserInitials = (): string => {
    const name = getUserDisplayName();
    if (!name || name === 'Convidado' || name === 'Usuário') {
      if (user?.email) {
        return user.email.substring(0, 2).toUpperCase();
      }
      return '5W';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isMasterUser = Boolean(
    user?.role === 'admin' ||
    user?.email?.toLowerCase().includes('admin@5w2h.local') ||
    user?.email?.toLowerCase().includes('iraeveras@outlook.com.br') ||
    user?.email?.toLowerCase().startsWith('admin')
  );
  const isImpersonating = Boolean(user?.impersonatedFrom);
  const impersonatedFrom = user?.impersonatedFrom || null;
  const isAdmin = isMasterUser || user?.role === 'admin';
  const isManager = !isAdmin && user?.role === 'gestor';
  const isMember = !isAdmin && !isManager && user?.role === 'membro';
  const isPending = !isAdmin && (user?.status === 'pendente' || !user?.status);

  // Normalize user object if admin
  const effectiveUser: AuthUser | null = user
    ? {
        ...user,
        role: isAdmin ? 'admin' : user.role,
        status: isAdmin ? 'ativo' : user.status,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        isLoading,
        isConfigured: true,
        isImpersonating,
        impersonatedFrom,
        signInWithEmail,
        signUp,
        signInWithGoogle,
        signOut,
        impersonateUser,
        stopImpersonation,
        refreshSession,
        getUserInitials,
        getUserDisplayName,
        isAdmin,
        isManager,
        isMember,
        isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
