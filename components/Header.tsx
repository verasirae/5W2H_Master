'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ViewMode } from '@/hooks/use5w2h';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import { exportTasksToExcel } from '@/lib/5w2h-utils';
import { safeFetchJson } from '@/lib/utils';
import {
  Search,
  Bell,
  Sun,
  Moon,
  User,
  PanelLeft,
  X,
  CheckCircle,
  AlertTriangle,
  Settings,
  LogOut,
  Users,
  UserCheck,
} from 'lucide-react';
import { DatabaseStatus } from '@/hooks/use5w2h';
import { useAuth } from '@/lib/auth/auth-context';

interface HeaderProps {
  workspaceConfig: WorkspaceConfig;
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredTasks: Task5W2H[];
  openCreateModal: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isSyncing?: boolean;
  dbStatus?: DatabaseStatus;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  workspaceConfig,
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  filteredTasks,
  openCreateModal,
  showToast,
  isSidebarExpanded,
  setIsSidebarExpanded,
  isSyncing,
  dbStatus,
  onRefresh,
}) => {
  const { user, getUserDisplayName, getUserInitials, signOut } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'dark' | 'light'>('dark');

  // Notifications and Invites state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isRespondingInvite, setIsRespondingInvite] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications');
      const { ok, data } = await safeFetchJson(res);
      if (ok && data?.success) {
        setNotifications(data.notifications || []);
        setPendingInvites(data.pendingInvites || []);
        setUnreadNotificationsCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Erro ao buscar notificações:', e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const loadNotifs = async () => {
      try {
        const res = await fetch('/api/notifications');
        const { ok, data } = await safeFetchJson(res);
        if (isMounted && ok && data?.success) {
          setNotifications(data.notifications || []);
          setPendingInvites(data.pendingInvites || []);
          setUnreadNotificationsCount(data.unreadCount || 0);
        }
      } catch (e) {
        console.error('Erro ao buscar notificações:', e);
      }
    };
    loadNotifs();
    const interval = setInterval(loadNotifs, 10000); // 10s poll
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleRespondInvite = async (inviteId: string, action: 'accept' | 'reject', listTitle: string) => {
    setIsRespondingInvite(inviteId);
    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const { ok, data, error } = await safeFetchJson(res);
      if (ok && data?.success) {
        if (action === 'accept') {
          showToast('success', 'Convite Aceito!', `Você agora faz parte da lista compartilhada "${listTitle}".`);
          setCurrentView('groups');
        } else {
          showToast('info', 'Convite Recusado', `O convite para "${listTitle}" foi recusado.`);
        }
        fetchNotifications();
        if (onRefresh) onRefresh();
      } else {
        showToast('error', 'Erro', data?.error || error || 'Não foi possível responder ao convite.');
      }
    } catch (err: any) {
      showToast('error', 'Erro', err?.message || 'Falha na requisição');
    } finally {
      setIsRespondingInvite(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      fetchNotifications();
    } catch (err) {
      console.error('Erro ao marcar como lidas:', err);
    }
  };

  // Load color mode preference safely after mount to prevent SSR hydration mismatches
  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem('5w2h_theme_mode');
        if (saved === 'light' || saved === 'dark') {
          setColorMode(saved);
        }
      } catch (e) {
        console.error('Error loading theme preference:', e);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync document theme classes with colorMode state
  React.useEffect(() => {
    if (colorMode === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [colorMode]);

  const toggleColorMode = () => {
    const nextMode = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(nextMode);
    try {
      localStorage.setItem('5w2h_theme_mode', nextMode);
    } catch (e) {
      console.error('Error saving theme preference:', e);
    }
    showToast('info', 'Modo de Cor', `Modo ${nextMode === 'dark' ? 'Escuro' : 'Claro'} ativado.`);
  };

  const overdueCount = filteredTasks.filter(
    (t) => t.status === 'Atrasado'
  ).length;

  return (
    <header className="ml-1 md:ml-2 mr-3 md:mr-4 mt-3 mb-3.5 bg-card border border-border h-14 px-3 md:px-4 flex items-center justify-between gap-3 shrink-0 z-30 relative select-none shadow-md">
      {/* Left Section: Expand/Collapse Sidebar Button + Brand Logo */}
      <div className="flex items-center gap-2">
        {/* Toggle Button: Only PanelLeft, no border, subtle bg on hover */}
        <button
          onClick={() => setIsSidebarExpanded((prev) => !prev)}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded shrink-0 cursor-pointer"
          title={isSidebarExpanded ? 'Recolher Menu Lateral' : 'Expandir Menu Lateral'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        {/* Vertical Separator */}
        <div
          role="separator"
          aria-orientation="vertical"
          className="h-5 w-[1px] bg-border mx-1 shrink-0"
        />

        {/* Title */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setCurrentView('dashboard')}
        >
          <h1 className="text-base md:text-lg font-bold text-foreground tracking-tight whitespace-nowrap">
            5W2H Master
          </h1>
        </div>
      </div>

      {/* Center Section: Search Bar */}
      <div className="hidden lg:flex flex-1 max-w-xl mx-2 md:mx-6 relative">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ações 5W2H, responsáveis, motivos..."
            className="w-full bg-background border border-input text-foreground text-xs font-mono-data pl-9 pr-8 py-2 focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-muted-foreground hover:text-foreground p-0.5"
              title="Limpar busca"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Section: Notifications, Color Mode, User Profile */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* 1. Notifications Icon */}
        <div className="relative">
          <button
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setIsUserMenuOpen(false);
            }}
            className={`p-2 transition-colors relative border ${
              isNotificationsOpen
                ? 'bg-accent text-foreground border-border'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Notificações e Convites"
          >
            <Bell className="w-4 h-4" />
            {(overdueCount > 0 || unreadNotificationsCount > 0 || pendingInvites.length > 0) && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-88 md:w-96 bg-popover border border-border shadow-2xl p-3.5 z-50 text-xs font-mono-data">
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-foreground uppercase tracking-wider text-xs">Central de Notificações</span>
                  {(pendingInvites.length > 0 || unreadNotificationsCount > 0) && (
                    <span className="px-1.5 py-0.2 text-[9px] bg-primary text-primary-foreground font-bold">
                      {pendingInvites.length + unreadNotificationsCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] text-primary hover:underline cursor-pointer"
                    >
                      Marcar lidas
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {/* 1. Pending List Invitations */}
                {pendingInvites.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                      Convites para Colaboração ({pendingInvites.length})
                    </span>
                    {pendingInvites.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-primary/10 border border-primary/30 text-foreground space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-xs text-foreground">
                              {inv.list?.title || 'Lista Compartilhada'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Grupo: <strong className="text-foreground">{inv.list?.group?.title || 'Grupo'}</strong>
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Convidado por: <strong className="text-foreground">{inv.inviter?.name || inv.inviter?.email}</strong>
                            </p>
                            {inv.message && (
                              <p className="text-[10px] text-muted-foreground italic mt-1 bg-background/50 p-1 border border-border">
                                &ldquo;{inv.message}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons: Aceitar / Recusar */}
                        <div className="flex items-center gap-2 pt-1 border-t border-primary/20">
                          <button
                            disabled={isRespondingInvite === inv.id}
                            onClick={() => handleRespondInvite(inv.id, 'accept', inv.list?.title || 'Lista')}
                            className="flex-1 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-center font-bold text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isRespondingInvite === inv.id ? 'Processando...' : 'Aceitar Convite'}
                          </button>
                          <button
                            disabled={isRespondingInvite === inv.id}
                            onClick={() => handleRespondInvite(inv.id, 'reject', inv.list?.title || 'Lista')}
                            className="px-3 py-1.5 bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted text-center font-semibold text-[11px] uppercase transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Recusar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. System / Info Notifications */}
                {notifications.filter((n) => !n.isRead && n.type !== 'list_invite').length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Avisos Recentes
                    </span>
                    {notifications
                      .filter((n) => !n.isRead && n.type !== 'list_invite')
                      .map((n) => (
                        <div key={n.id} className="p-2 bg-muted/40 border border-border text-foreground">
                          <p className="font-bold text-xs">{n.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                        </div>
                      ))}
                  </div>
                )}

                {/* 3. SLA Warning */}
                {overdueCount > 0 && (
                  <div className="p-2 bg-destructive/15 border border-destructive text-destructive flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Atenção no SLA</p>
                      <p className="text-[11px] opacity-90">
                        {overdueCount} tarefa(s) estão com prazo atrasado!
                      </p>
                    </div>
                  </div>
                )}

                {pendingInvites.length === 0 && overdueCount === 0 && (
                  <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[11px]">Nenhuma notificação urgente pendente.</span>
                  </div>
                )}

                <div className="p-2 bg-background border border-border text-muted-foreground">
                  <p className="font-bold text-foreground">Workspace Ativo</p>
                  <p className="text-[10px] text-muted-foreground">{workspaceConfig.departmentName}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Color Mode / Theme Toggle */}
        <button
          onClick={toggleColorMode}
          className="p-2 border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          title={`Alternar Modo de Cor (${colorMode === 'dark' ? 'Escuro' : 'Claro'})`}
        >
          {colorMode === 'dark' ? (
            <Sun className="w-4 h-4 text-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-foreground" />
          )}
        </button>

        {/* 3. User Profile Icon */}
        <div className="relative">
          <button
            id="btn-header-user-menu"
            onClick={() => {
              setIsUserMenuOpen((prev) => !prev);
              setIsNotificationsOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-background border border-border hover:border-primary flex items-center justify-center text-foreground transition-colors ml-1 font-bold text-xs cursor-pointer"
            title="Menu do Usuário"
          >
            {user ? (
              <span className="text-primary">{getUserInitials()}</span>
            ) : (
              <User className="w-4 h-4 text-foreground" />
            )}
          </button>

          {/* Backdrop for click outside */}
          {(isUserMenuOpen || isNotificationsOpen) && (
            <div
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px]"
              onClick={() => {
                setIsUserMenuOpen(false);
                setIsNotificationsOpen(false);
              }}
            />
          )}

          {/* User Profile Dropdown Popover */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-popover border border-border shadow-2xl p-3 z-50 text-xs">
              <div className="flex items-center gap-3 border-b border-border pb-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-background border border-primary flex items-center justify-center font-bold text-primary shrink-0 text-sm">
                  {getUserInitials()}
                </div>
                <div className="overflow-hidden min-w-0 flex-1">
                  <p className="font-bold text-foreground truncate" title={getUserDisplayName()}>
                    {getUserDisplayName()}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono-data truncate" title={user?.email || 'iraeveras@outlook.com.br'}>
                    {user?.email || 'iraeveras@outlook.com.br'}
                  </p>
                  <span className="text-[9px] bg-accent text-primary px-1.5 py-0.2 uppercase font-mono-data mt-1 inline-block">
                    {user ? `Perfil: ${user.role || 'admin'}` : 'Gestor 5W2H'}
                  </span>
                </div>
              </div>
              <div className="space-y-1 font-mono-data">
                <button
                  id="btn-header-profile-view"
                  onClick={() => {
                    setCurrentView('profile');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5 text-primary" />
                  <span>Meu Perfil & Atividades</span>
                </button>

                <button
                  id="btn-header-users-management"
                  onClick={() => {
                    setCurrentView('users');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-primary" />
                  <span>Gerenciamento de Usuários</span>
                </button>

                <button
                  id="btn-header-profile-settings"
                  onClick={() => {
                    setCurrentView('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configurações do Workspace</span>
                </button>

                <button
                  id="btn-header-logout"
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await signOut();
                  }}
                  className="w-full text-left px-2 py-1.5 text-destructive hover:bg-destructive/10 flex items-center gap-2 cursor-pointer transition-colors pt-1 border-t border-border mt-1 font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta (Logout)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
