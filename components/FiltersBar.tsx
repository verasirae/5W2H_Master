'use client';

import React, { useState } from 'react';
import { FilterState } from '@/types/5w2h';
import { Filter, RotateCcw, ChevronDown, SlidersHorizontal, X, Archive, Inbox, Layers } from 'lucide-react';

interface FiltersBarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  resetFilters: () => void;
  availableDepartments: string[];
  availableCategories: string[];
  availableCompetences: string[];
  availableResponsibles: string[];
  totalFilteredCount: number;
  totalCount: number;
  openCreateModal?: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  setFilters,
  resetFilters,
  availableDepartments,
  availableCategories,
  availableCompetences,
  availableResponsibles,
  totalFilteredCount,
  totalCount,
}) => {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const activeFiltersCount = [
    filters.department !== 'Todos',
    filters.category !== 'Todas',
    filters.competence !== 'Todas',
    filters.status !== 'Todos',
    filters.priority !== 'Todas',
    filters.who !== 'Todos',
    filters.deadlineSituation !== 'Todas',
    filters.searchQuery !== '',
  ].filter(Boolean).length;

  const isFiltered = activeFiltersCount > 0;

  return (
    <>
      {/* 
        ========================================================================
        MOBILE & TABLET VIEW (< lg): Floating Half-Moon Toggle at Top-Right
        ========================================================================
      */}
      <div className="lg:hidden relative w-full px-3 md:pl-2 md:pr-4 mb-2">
        <div className="flex justify-between items-center">
          {/* Active summary info */}
          <div className="flex items-center gap-2 text-[11px] font-mono-data text-muted-foreground">
            <span className="truncate max-w-[200px]">
              {totalFilteredCount} de {totalCount} tarefas
            </span>
            {isFiltered && (
              <span className="px-1.5 py-0.2 bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px] font-bold">
                {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Half-moon / Pill Floating Toggle Button in Top Right */}
          <div className="flex items-center gap-2">
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-2 py-1 border border-border bg-background hover:bg-muted text-foreground text-[10px] uppercase tracking-wider font-mono-data transition-colors rounded-md cursor-pointer"
                title="Limpar todos os filtros"
              >
                <RotateCcw className="w-3 h-3 text-destructive" />
                <span className="hidden sm:inline">Limpar</span>
              </button>
            )}

            <button
              onClick={() => setIsMobileExpanded((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border shadow-md font-mono-data text-xs transition-all duration-300 cursor-pointer select-none rounded-full ${
                isMobileExpanded
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-foreground border-border hover:border-primary/50'
              }`}
              title={isMobileExpanded ? 'Recolher Filtros' : 'Expandir Filtros'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="font-bold">Filtros</span>
              {isFiltered && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    isMobileExpanded ? 'bg-primary-foreground' : 'bg-primary'
                  }`}
                />
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-300 ${
                  isMobileExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Collapsible Filters Dropdown / Drawer for Mobile/Tablet */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isMobileExpanded
              ? 'max-h-[600px] opacity-100 mt-2.5 shadow-lg border border-border'
              : 'max-h-0 opacity-0 pointer-events-none mt-0 border-none'
          } bg-card rounded-md p-3 text-xs z-20 relative`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium uppercase tracking-wider text-[11px] font-mono-data">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>Painel de Filtros 5W2H</span>
            </div>
            <button
              onClick={() => setIsMobileExpanded(false)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Scope Tabs */}
          <div className="flex items-center bg-background border border-border rounded-md p-1 gap-1 font-mono-data mb-3">
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, scope: 'active', status: prev.status === 'Arquivado' ? 'Todos' : prev.status }))}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                (filters.scope || 'active') === 'active'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Inbox className="w-3 h-3" />
              <span>Ativas</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, scope: 'archived', status: 'Todos' }))}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filters.scope === 'archived'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>Arquivadas</span>
            </button>
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, scope: 'all' }))}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                filters.scope === 'all'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Todas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {/* Department */}
            <div className="flex flex-col gap-1 bg-background border border-border rounded-md px-2.5 py-1.5">
              <span className="text-muted-foreground uppercase text-[10px] font-mono-data font-semibold">
                Departamento:
              </span>
              <select
                value={filters.department}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    department: e.target.value,
                    category: 'Todas',
                  }))
                }
                className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs"
              >
                <option value="Todos" className="bg-popover text-foreground">Todos Departamentos</option>
                {availableDepartments.map((d) => (
                  <option key={d} value={d} className="bg-popover text-foreground">{d}</option>
                ))}
              </select>
            </div>

            {/* Category / Routine */}
            <div className="flex flex-col gap-1 bg-background border border-border rounded-md px-2.5 py-1.5">
              <span className="text-muted-foreground uppercase text-[10px] font-mono-data font-semibold">
                Categoria / Rotina:
              </span>
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs"
              >
                <option value="Todas" className="bg-popover text-foreground">Todas Categorias</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c} className="bg-popover text-foreground">{c}</option>
                ))}
              </select>
            </div>

            {/* Competence */}
            <div className="flex flex-col gap-1 bg-background border border-border rounded-md px-2.5 py-1.5">
              <span className="text-muted-foreground uppercase text-[10px] font-mono-data font-semibold">
                Competência:
              </span>
              <select
                value={filters.competence}
                onChange={(e) => setFilters((prev) => ({ ...prev, competence: e.target.value }))}
                className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs"
              >
                <option value="Todas" className="bg-popover text-foreground">Todas Competências</option>
                {availableCompetences.map((comp) => (
                  <option key={comp} value={comp} className="bg-popover text-foreground">{comp}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1 bg-background border border-border rounded-md px-2.5 py-1.5">
              <span className="text-muted-foreground uppercase text-[10px] font-mono-data font-semibold">
                Status:
              </span>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs"
              >
                <option value="Todos" className="bg-popover text-foreground">Todos Status</option>
                <option value="Não iniciado" className="bg-popover text-foreground">Não iniciado</option>
                <option value="Em andamento" className="bg-popover text-foreground">Em andamento</option>
                <option value="Concluído" className="bg-popover text-foreground">Concluído</option>
                <option value="Atrasado" className="bg-popover text-foreground">Atrasado</option>
                <option value="Cancelado" className="bg-popover text-foreground">Cancelado</option>
                <option value="Arquivado" className="bg-popover text-foreground">Arquivado</option>
              </select>
            </div>

            {/* Deadline Situation */}
            <div className="flex flex-col gap-1 bg-background border border-border rounded-md px-2.5 py-1.5">
              <span className="text-muted-foreground uppercase text-[10px] font-mono-data font-semibold">
                Prazo:
              </span>
              <select
                value={filters.deadlineSituation}
                onChange={(e) => setFilters((prev) => ({ ...prev, deadlineSituation: e.target.value }))}
                className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs"
              >
                <option value="Todas" className="bg-popover text-foreground">Todas Situações</option>
                <option value="No Prazo" className="bg-popover text-foreground">No Prazo</option>
                <option value="Atenção" className="bg-popover text-foreground">Atenção (≤ 3 dias)</option>
                <option value="Atrasado" className="bg-popover text-foreground">Atrasado</option>
                <option value="Concluído" className="bg-popover text-foreground">Concluído</option>
              </select>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1 bg-background border border-border rounded-md px-2.5 py-1.5">
              <span className="text-muted-foreground uppercase text-[10px] font-mono-data font-semibold">
                Prioridade:
              </span>
              <select
                value={filters.priority}
                onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
                className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs"
              >
                <option value="Todas" className="bg-popover text-foreground">Todas Prioridades</option>
                <option value="Baixa" className="bg-popover text-foreground">Baixa</option>
                <option value="Média" className="bg-popover text-foreground">Média</option>
                <option value="Alta" className="bg-popover text-foreground">Alta</option>
                <option value="Urgente" className="bg-popover text-foreground">Urgente</option>
              </select>
            </div>

            {/* Responsible */}
            {availableResponsibles.length > 0 && (
              <div className="flex flex-col gap-1 bg-background border border-border rounded-md px-2.5 py-1.5">
                <span className="text-muted-foreground uppercase text-[10px] font-mono-data font-semibold">
                  Responsável:
                </span>
                <select
                  value={filters.who}
                  onChange={(e) => setFilters((prev) => ({ ...prev, who: e.target.value }))}
                  className="bg-transparent text-foreground focus:outline-none cursor-pointer text-xs"
                >
                  <option value="Todos" className="bg-popover text-foreground">Todos Responsáveis</option>
                  {availableResponsibles.map((resp) => (
                    <option key={resp} value={resp} className="bg-popover text-foreground">{resp}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        DESKTOP VIEW (>= lg): Sleek Persistent Filter Toolbar
        ========================================================================
      */}
      <section className="hidden lg:flex ml-1 md:ml-2 mr-3 md:mr-4 mb-2 bg-card border border-border px-3.5 py-2 flex-wrap items-center gap-3 text-xs shrink-0 shadow-sm rounded-md">
        {/* Scope Tabs: Ativas / Arquivadas / Todas */}
        <div className="flex items-center bg-background border border-border rounded-md p-0.5 gap-0.5 font-mono-data">
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, scope: 'active', status: prev.status === 'Arquivado' ? 'Todos' : prev.status }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              (filters.scope || 'active') === 'active'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Exibir tarefas ativas"
          >
            <Inbox className="w-3 h-3" />
            <span>Ativas</span>
          </button>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, scope: 'archived', status: 'Todos' }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              filters.scope === 'archived'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Exibir tarefas arquivadas"
          >
            <Archive className="w-3 h-3" />
            <span>Arquivadas</span>
          </button>
          <button
            type="button"
            onClick={() => setFilters((prev) => ({ ...prev, scope: 'all' }))}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
              filters.scope === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            title="Exibir todas as tarefas (ativas e arquivadas)"
          >
            <Layers className="w-3 h-3" />
            <span>Todas</span>
          </button>
        </div>

        {/* Label */}
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium uppercase tracking-wider pr-2 border-r border-border font-mono-data">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span>Filtros:</span>
        </div>

        {/* Department Filter */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-md px-2 py-1">
          <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Depto:</span>
          <select
            value={filters.department}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                department: e.target.value,
                category: 'Todas',
              }))
            }
            className="bg-transparent text-foreground focus:outline-none cursor-pointer max-w-[140px] truncate font-mono-data"
          >
            <option value="Todos" className="bg-popover text-foreground">Todos</option>
            {availableDepartments.map((d) => (
              <option key={d} value={d} className="bg-popover text-foreground">
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Category / Routine Filter */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-md px-2 py-1">
          <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Categoria:</span>
          <select
            value={filters.category}
            onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="bg-transparent text-foreground focus:outline-none cursor-pointer max-w-[130px] truncate font-mono-data"
          >
            <option value="Todas" className="bg-popover text-foreground">Todas</option>
            {availableCategories.map((c) => (
              <option key={c} value={c} className="bg-popover text-foreground">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Competence Filter */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-md px-2 py-1">
          <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Comp.:</span>
          <select
            value={filters.competence}
            onChange={(e) => setFilters((prev) => ({ ...prev, competence: e.target.value }))}
            className="bg-transparent text-foreground focus:outline-none cursor-pointer font-mono-data"
          >
            <option value="Todas" className="bg-popover text-foreground">Todas</option>
            {availableCompetences.map((comp) => (
              <option key={comp} value={comp} className="bg-popover text-foreground">
                {comp}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-md px-2 py-1">
          <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Status:</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="bg-transparent text-foreground focus:outline-none cursor-pointer font-mono-data"
          >
            <option value="Todos" className="bg-popover text-foreground">Todos</option>
            <option value="Não iniciado" className="bg-popover text-foreground">Não iniciado</option>
            <option value="Em andamento" className="bg-popover text-foreground">Em andamento</option>
            <option value="Concluído" className="bg-popover text-foreground">Concluído</option>
            <option value="Atrasado" className="bg-popover text-foreground">Atrasado</option>
            <option value="Cancelado" className="bg-popover text-foreground">Cancelado</option>
            <option value="Arquivado" className="bg-popover text-foreground">Arquivado</option>
          </select>
        </div>

        {/* Deadline Situation Filter */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-md px-2 py-1">
          <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Prazo:</span>
          <select
            value={filters.deadlineSituation}
            onChange={(e) => setFilters((prev) => ({ ...prev, deadlineSituation: e.target.value }))}
            className="bg-transparent text-foreground focus:outline-none cursor-pointer font-mono-data"
          >
            <option value="Todas" className="bg-popover text-foreground">Todas</option>
            <option value="No Prazo" className="bg-popover text-foreground">No Prazo</option>
            <option value="Atenção" className="bg-popover text-foreground">Atenção (≤ 3d)</option>
            <option value="Atrasado" className="bg-popover text-foreground">Atrasado</option>
            <option value="Concluído" className="bg-popover text-foreground">Concluído</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 bg-background border border-border rounded-md px-2 py-1">
          <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Prioridade:</span>
          <select
            value={filters.priority}
            onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
            className="bg-transparent text-foreground focus:outline-none cursor-pointer font-mono-data"
          >
            <option value="Todas" className="bg-popover text-foreground">Todas</option>
            <option value="Baixa" className="bg-popover text-foreground">Baixa</option>
            <option value="Média" className="bg-popover text-foreground">Média</option>
            <option value="Alta" className="bg-popover text-foreground">Alta</option>
            <option value="Urgente" className="bg-popover text-foreground">Urgente</option>
          </select>
        </div>

        {/* Responsible Filter */}
        {availableResponsibles.length > 0 && (
          <div className="flex items-center gap-1 bg-background border border-border rounded-md px-2 py-1">
            <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Quem:</span>
            <select
              value={filters.who}
              onChange={(e) => setFilters((prev) => ({ ...prev, who: e.target.value }))}
              className="bg-transparent text-foreground focus:outline-none cursor-pointer max-w-[120px] truncate font-mono-data"
            >
              <option value="Todos" className="bg-popover text-foreground">Todos</option>
              {availableResponsibles.map((resp) => (
                <option key={resp} value={resp} className="bg-popover text-foreground">
                  {resp}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Reset & Counter Action */}
        <div className="ml-auto flex items-center gap-2.5 font-mono-data">
          <span className="text-[11px] text-muted-foreground">
            {totalFilteredCount} de {totalCount} tarefas
          </span>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1 border border-border bg-background hover:bg-muted text-foreground text-[11px] uppercase tracking-wider rounded-md transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-destructive" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </section>
    </>
  );
};
