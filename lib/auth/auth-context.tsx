'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string;
  department?: string | null;
  jobTitle?: string | null;
  provider?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  getUserInitials: () => string;
  getUserDisplayName: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Error fetching current session:', e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : { authenticated: false, user: null }))
      .then((data) => {
        if (!isMounted) return;
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch((e) => {
        if (!isMounted) return;
        console.error('Error fetching current session:', e);
        setUser(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

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
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Credenciais inválidas' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro ao conectar ao servidor' };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        setUser(data.user);
        return { success: true };
      }
      return { success: false, error: data.error || 'Erro ao criar conta' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro ao conectar ao servidor' };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Falha ao obter URL de autenticação do Google');
      }
      const { url } = await res.json();
      
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

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setUser(null);
    window.location.replace('/login');
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConfigured: true,
        signInWithEmail,
        signUp,
        signInWithGoogle,
        signOut,
        refreshSession,
        getUserInitials,
        getUserDisplayName,
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
