'use client';

import React from 'react';
import { FilterState } from '@/types/5w2h';
import { Filter, RotateCcw, Plus } from 'lucide-react';

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
  openCreateModal,
}) => {
  const isFiltered =
    filters.department !== 'Todos' ||
    filters.category !== 'Todas' ||
    filters.competence !== 'Todas' ||
    filters.status !== 'Todos' ||
    filters.priority !== 'Todas' ||
    filters.who !== 'Todos' ||
    filters.deadlineSituation !== 'Todas' ||
    filters.searchQuery !== '';

  return (
    <section className="ml-1 md:ml-2 mr-3 md:mr-4 mb-2 bg-card border border-border px-3.5 py-2 flex flex-wrap items-center gap-3 text-xs shrink-0 shadow-sm">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-muted-foreground font-medium uppercase tracking-wider pr-2 border-r border-border">
        <Filter className="w-3.5 h-3.5 text-primary" />
        <span>Filtros:</span>
      </div>

      {/* Department Filter */}
      <div className="flex items-center gap-1 bg-background border-b border-border px-2 py-1">
        <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Depto:</span>
        <select
          value={filters.department}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              department: e.target.value,
              category: 'Todas', // Reset category when department changes
            }))
          }
          className="bg-transparent text-foreground focus:outline-none cursor-pointer max-w-[140px] truncate"
        >
          <option value="Todos" className="bg-popover text-foreground">Todos Departamentos</option>
          {availableDepartments.map((d) => (
            <option key={d} value={d} className="bg-popover text-foreground">
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Category / Routine Filter */}
      <div className="flex items-center gap-1 bg-background border-b border-border px-2 py-1">
        <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Categoria:</span>
        <select
          value={filters.category}
          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
          className="bg-transparent text-foreground focus:outline-none cursor-pointer max-w-[140px] truncate"
        >
          <option value="Todas" className="bg-popover text-foreground">Todas Categorias</option>
          {availableCategories.map((c) => (
            <option key={c} value={c} className="bg-popover text-foreground">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Competence Filter */}
      <div className="flex items-center gap-1 bg-background border-b border-border px-2 py-1">
        <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Comp.:</span>
        <select
          value={filters.competence}
          onChange={(e) => setFilters((prev) => ({ ...prev, competence: e.target.value }))}
          className="bg-transparent text-foreground focus:outline-none cursor-pointer"
        >
          <option value="Todas" className="bg-popover text-foreground">Todas Competências</option>
          {availableCompetences.map((comp) => (
            <option key={comp} value={comp} className="bg-popover text-foreground">
              {comp}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1 bg-background border-b border-border px-2 py-1">
        <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Status:</span>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="bg-transparent text-foreground focus:outline-none cursor-pointer"
        >
          <option value="Todos" className="bg-popover text-foreground">Todos Status</option>
          <option value="Não iniciado" className="bg-popover text-foreground">Não iniciado</option>
          <option value="Em andamento" className="bg-popover text-foreground">Em andamento</option>
          <option value="Concluído" className="bg-popover text-foreground">Concluído</option>
          <option value="Atrasado" className="bg-popover text-foreground">Atrasado</option>
          <option value="Cancelado" className="bg-popover text-foreground">Cancelado</option>
        </select>
      </div>

      {/* Deadline Situation Filter */}
      <div className="flex items-center gap-1 bg-background border-b border-border px-2 py-1">
        <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Prazo:</span>
        <select
          value={filters.deadlineSituation}
          onChange={(e) => setFilters((prev) => ({ ...prev, deadlineSituation: e.target.value }))}
          className="bg-transparent text-foreground focus:outline-none cursor-pointer"
        >
          <option value="Todas" className="bg-popover text-foreground">Todas Situações</option>
          <option value="No Prazo" className="bg-popover text-primary font-medium">No Prazo</option>
          <option value="Atenção" className="bg-popover text-info font-medium">Atenção (&le; 3 dias)</option>
          <option value="Atrasado" className="bg-popover text-destructive font-medium">Atrasado</option>
          <option value="Concluído" className="bg-popover text-muted-foreground">Concluído</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-1 bg-background border-b border-border px-2 py-1">
        <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Prioridade:</span>
        <select
          value={filters.priority}
          onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
          className="bg-transparent text-foreground focus:outline-none cursor-pointer"
        >
          <option value="Todas" className="bg-popover text-foreground">Todas Prioridades</option>
          <option value="Baixa" className="bg-popover text-foreground">Baixa</option>
          <option value="Média" className="bg-popover text-foreground">Média</option>
          <option value="Alta" className="bg-popover text-foreground">Alta</option>
          <option value="Urgente" className="bg-popover text-destructive font-medium">Urgente</option>
        </select>
      </div>

      {/* Responsible Filter */}
      {availableResponsibles.length > 0 && (
        <div className="flex items-center gap-1 bg-background border-b border-border px-2 py-1">
          <span className="text-muted-foreground uppercase text-[10px] font-mono-data">Quem:</span>
          <select
            value={filters.who}
            onChange={(e) => setFilters((prev) => ({ ...prev, who: e.target.value }))}
            className="bg-transparent text-foreground focus:outline-none cursor-pointer max-w-[120px] truncate"
          >
            <option value="Todos" className="bg-popover text-foreground">Todos Responsáveis</option>
            {availableResponsibles.map((resp) => (
              <option key={resp} value={resp} className="bg-popover text-foreground">
                {resp}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reset, Counter & New Task Action */}
      <div className="ml-auto flex items-center gap-2.5">
        <span className="text-[11px] font-mono-data text-muted-foreground hidden sm:inline">
          {totalFilteredCount} de {totalCount} tarefas
        </span>
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2.5 py-1 border border-border bg-background hover:bg-muted text-foreground text-[11px] uppercase tracking-wider font-mono-data transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-destructive" />
            <span>Limpar</span>
          </button>
        )}
        {openCreateModal && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1 border border-primary bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm cursor-pointer"
            title="Criar Nova Tarefa 5W2H"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Tarefa</span>
          </button>
        )}
      </div>
    </section>
  );
};
