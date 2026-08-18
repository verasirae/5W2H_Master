'use client';

import React, { useState } from 'react';
import { ViewMode } from '@/hooks/use5w2h';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import { exportTasksToExcel } from '@/lib/5w2h-utils';
import {
  Search,
  Plus,
  BarChart2,
  Bell,
  Sun,
  Moon,
  User,
  PanelLeft,
  X,
  CheckCircle,
  AlertTriangle,
  Settings,
  Sparkles,
  Download,
  Database,
  RefreshCw,
  LogOut,
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
  isSyncing = false,
  dbStatus,
  onRefresh,
}) => {
  const { user, getUserDisplayName, getUserInitials, signOut, isConfigured } = useAuth();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [colorMode, setColorMode] = useState<'dark' | 'light'>('dark');

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

  const handleExport = () => {
    if (filteredTasks.length === 0) {
      showToast('info', 'Sem dados', 'Não há tarefas filtradas para exportar.');
      return;
    }
    try {
      exportTasksToExcel(filteredTasks, workspaceConfig.attentionThresholdDays);
      showToast('success', 'Exportação Concluída', `${filteredTasks.length} tarefas exportadas para Excel.`);
    } catch (error) {
      console.error('Export error:', error);
      showToast('error', 'Erro na Exportação', 'Não foi possível gerar a planilha Excel.');
    }
  };

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

      {/* Center Section: Search Bar (Hidden on Mobile/Tablet < lg to prioritize Notification, Color Mode, User) */}
      <div className="hidden lg:flex flex-1 max-w-xl mx-2 md:mx-6 relative">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 absolute left-3 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, processes..."
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

      {/* Right Section: DB Status, Notifications, Color Mode, User Profile */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Database Status & Refresh Trigger */}
        {dbStatus && (
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono-data border rounded transition-colors ${
              dbStatus.connected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
            }`}
            title={
              dbStatus.connected
                ? 'PostgreSQL Local Conectado - Clique para sincronizar'
                : 'Modo Offline - Verifique a conexão com PostgreSQL'
            }
          >
            <Database className="w-3 h-3 shrink-0" />
            <span className="hidden md:inline font-medium">
              {dbStatus.connected ? 'PostgreSQL' : 'Offline'}
            </span>
            <RefreshCw
              className={`w-3 h-3 shrink-0 ${isSyncing ? 'animate-spin text-primary' : 'opacity-70'}`}
            />
          </button>
        )}

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
            title="Notificações e Alertas"
          >
            <Bell className="w-4 h-4" />
            {overdueCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-popover border border-border shadow-2xl p-3 z-50 text-xs font-mono-data">
              <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
                <span className="font-bold text-foreground uppercase">Central de Notificações</span>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {overdueCount > 0 ? (
                  <div className="p-2 bg-destructive/15 border border-destructive text-destructive flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Atenção no SLA</p>
                      <p className="text-[11px] opacity-90">
                        {overdueCount} tarefa(s) estão com prazo atrasado!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 bg-primary/10 border border-primary text-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>Todas as tarefas estão no prazo normal.</span>
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
          className="p-2 border border-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
            onClick={() => {
              setIsUserMenuOpen((prev) => !prev);
              setIsNotificationsOpen(false);
            }}
            className="w-8 h-8 rounded-full bg-background border border-border hover:border-primary flex items-center justify-center text-foreground transition-colors ml-1 font-bold text-xs"
            title="Perfil de Usuário"
          >
            {user ? (
              <span className="text-primary">{getUserInitials()}</span>
            ) : (
              <User className="w-4 h-4 text-foreground" />
            )}
          </button>

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
                    {user ? 'Autenticado' : 'Gestor 5W2H'}
                  </span>
                </div>
              </div>
              <div className="space-y-1 font-mono-data">
                <button
                  onClick={() => {
                    setCurrentView('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Configurações da Conta</span>
                </button>
                <button
                  onClick={async () => {
                    setIsUserMenuOpen(false);
                    await signOut();
                  }}
                  className="w-full text-left px-2 py-1.5 text-destructive hover:bg-destructive/10 flex items-center gap-2 cursor-pointer transition-colors pt-1 border-t border-border mt-1"
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

