'use client';

import React from 'react';
import { ViewMode } from '@/hooks/use5w2h';
import {
  LayoutDashboard,
  ListTodo,
  Kanban,
  LayoutGrid,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  UserCheck,
} from 'lucide-react';

interface NavbarProps {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  openCreateModal?: () => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  isSidebarExpanded,
  setIsSidebarExpanded,
}) => {
  const navItems = [
    { id: 'dashboard' as ViewMode, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'table' as ViewMode, label: 'Lista (Tabela)', icon: ListTodo },
    { id: 'kanban' as ViewMode, label: 'Quadro Kanban', icon: Kanban },
    { id: 'cards' as ViewMode, label: 'Matriz 5W2H', icon: LayoutGrid },
    { id: 'ai' as ViewMode, label: 'Gerador IA', icon: Sparkles, badge: 'AI' },
    { id: 'users' as ViewMode, label: 'Usuários', icon: Users },
    { id: 'profile' as ViewMode, label: 'Meu Perfil', icon: UserCheck },
    { id: 'settings' as ViewMode, label: 'Configurações', icon: Settings },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className={`mt-3 mb-3 ml-3 md:ml-4 mr-1 md:mr-2 h-[calc(100vh-24px)] bg-card text-foreground border border-border shadow-md flex flex-col items-center py-2.5 z-40 transition-all duration-300 ease-in-out shrink-0 overflow-hidden select-none ${
        isSidebarExpanded ? 'w-[220px]' : 'w-[38px]'
      }`}
    >
      {/* Brand Header */}
      <div
        className="flex items-center w-full px-1 mb-4 shrink-0 cursor-pointer justify-center"
        onClick={() => setCurrentView('dashboard')}
        title="5W2H Master - Ir para Dashboard"
      >
        <div className={`flex items-center gap-2 overflow-hidden w-full ${isSidebarExpanded ? 'px-2 justify-start' : 'justify-center'}`}>
          <div className="w-6 h-6 bg-background border border-border flex items-center justify-center shrink-0 font-bold text-xs text-foreground shadow-sm">
            5
          </div>
          {isSidebarExpanded && (
            <div className="transition-opacity duration-200 whitespace-nowrap overflow-hidden">
              <span className="font-bold text-xs text-foreground block leading-none">
                5W2H Master
              </span>
              <span className="text-[8px] text-muted-foreground uppercase tracking-wider font-mono-data">
                Gestão de Ações
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col space-y-1 w-full px-0.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              title={!isSidebarExpanded ? item.label : undefined}
              className={`w-full flex items-center h-9 transition-all relative group rounded-none cursor-pointer ${
                isSidebarExpanded ? 'px-2.5 justify-start' : 'justify-center px-0'
              } ${
                isActive
                  ? 'text-primary border-l-2 border-primary bg-accent font-semibold'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {isSidebarExpanded && (
                <span className="ml-2.5 text-xs uppercase tracking-wider font-medium truncate whitespace-nowrap">
                  {item.label}
                </span>
              )}
              {item.badge && (
                <span
                  className={`text-[9px] bg-primary text-primary-foreground font-bold px-1 py-0.2 font-mono-data ${
                    isSidebarExpanded ? 'ml-auto' : 'absolute top-0.5 right-0.5 px-0.5 text-[7px]'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Tooltip on Collapsed Hover */}
              {!isSidebarExpanded && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-popover text-popover-foreground text-xs font-mono-data border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Support / Guide Link & Sidebar Toggle Button */}
      <div className="mt-auto w-full px-0.5 pt-1.5 border-t border-border flex flex-col gap-1">
        <button
          onClick={() => setCurrentView('settings')}
          title={!isSidebarExpanded ? 'Manual & Guia 5W2H' : undefined}
          className={`w-full flex items-center h-9 text-muted-foreground hover:text-primary hover:bg-muted transition-all group relative cursor-pointer ${
            isSidebarExpanded ? 'px-2.5 justify-start' : 'justify-center px-0'
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {isSidebarExpanded && (
            <span className="ml-2.5 text-xs uppercase tracking-wider font-medium truncate whitespace-nowrap">
              Manual 5W2H
            </span>
          )}
          {!isSidebarExpanded && (
            <div className="absolute left-full ml-2 px-2.5 py-1 bg-popover text-popover-foreground text-xs font-mono-data border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
              Manual 5W2H
            </div>
          )}
        </button>

        {/* Explicit Expand / Collapse Button at bottom of sidebar */}
        <button
          onClick={() => setIsSidebarExpanded((prev) => !prev)}
          title={isSidebarExpanded ? 'Recolher Sidebar' : 'Expandir Sidebar'}
          className={`w-full flex items-center h-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer ${
            isSidebarExpanded ? 'px-2.5 justify-start' : 'justify-center px-0'
          }`}
        >
          {isSidebarExpanded ? (
            <>
              <ChevronLeft className="w-4 h-4 shrink-0 text-muted-foreground" />
              <span className="ml-2.5 text-xs text-muted-foreground uppercase tracking-wider truncate">
                Recolher
              </span>
            </>
          ) : (
            <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </div>
    </aside>
  );
};
