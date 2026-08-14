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
    <section className="ml-1 md:ml-2 mr-3 md:mr-4 mb-2 bg-[#1e2020] border border-[#444748] px-3.5 py-2 flex flex-wrap items-center gap-3 text-xs shrink-0 shadow-sm">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-[#c4c7c7] font-medium uppercase tracking-wider pr-2 border-r border-[#444748]">
        <Filter className="w-3.5 h-3.5 text-[#4ae183]" />
        <span>Filtros:</span>
      </div>

      {/* Department Filter */}
      <div className="flex items-center gap-1 bg-[#0c0f0f] border-b border-[#444748] px-2 py-1">
        <span className="text-[#8e9192] uppercase text-[10px] font-mono-data">Depto:</span>
        <select
          value={filters.department}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              department: e.target.value,
              category: 'Todas', // Reset category when department changes
            }))
          }
          className="bg-transparent text-[#e2e2e2] focus:outline-none cursor-pointer max-w-[140px] truncate"
        >
          <option value="Todos" className="bg-[#1e2020] text-[#e2e2e2]">Todos Departamentos</option>
          {availableDepartments.map((d) => (
            <option key={d} value={d} className="bg-[#1e2020] text-[#e2e2e2]">
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Category / Routine Filter */}
      <div className="flex items-center gap-1 bg-[#0c0f0f] border-b border-[#444748] px-2 py-1">
        <span className="text-[#8e9192] uppercase text-[10px] font-mono-data">Categoria:</span>
        <select
          value={filters.category}
          onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
          className="bg-transparent text-[#e2e2e2] focus:outline-none cursor-pointer max-w-[140px] truncate"
        >
          <option value="Todas" className="bg-[#1e2020] text-[#e2e2e2]">Todas Categorias</option>
          {availableCategories.map((c) => (
            <option key={c} value={c} className="bg-[#1e2020] text-[#e2e2e2]">
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Competence Filter */}
      <div className="flex items-center gap-1 bg-[#0c0f0f] border-b border-[#444748] px-2 py-1">
        <span className="text-[#8e9192] uppercase text-[10px] font-mono-data">Comp.:</span>
        <select
          value={filters.competence}
          onChange={(e) => setFilters((prev) => ({ ...prev, competence: e.target.value }))}
          className="bg-transparent text-[#e2e2e2] focus:outline-none cursor-pointer"
        >
          <option value="Todas" className="bg-[#1e2020] text-[#e2e2e2]">Todas Competências</option>
          {availableCompetences.map((comp) => (
            <option key={comp} value={comp} className="bg-[#1e2020] text-[#e2e2e2]">
              {comp}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1 bg-[#0c0f0f] border-b border-[#444748] px-2 py-1">
        <span className="text-[#8e9192] uppercase text-[10px] font-mono-data">Status:</span>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="bg-transparent text-[#e2e2e2] focus:outline-none cursor-pointer"
        >
          <option value="Todos" className="bg-[#1e2020] text-[#e2e2e2]">Todos Status</option>
          <option value="Não iniciado" className="bg-[#1e2020] text-[#e2e2e2]">Não iniciado</option>
          <option value="Em andamento" className="bg-[#1e2020] text-[#e2e2e2]">Em andamento</option>
          <option value="Concluído" className="bg-[#1e2020] text-[#e2e2e2]">Concluído</option>
          <option value="Atrasado" className="bg-[#1e2020] text-[#e2e2e2]">Atrasado</option>
          <option value="Cancelado" className="bg-[#1e2020] text-[#e2e2e2]">Cancelado</option>
        </select>
      </div>

      {/* Deadline Situation Filter */}
      <div className="flex items-center gap-1 bg-[#0c0f0f] border-b border-[#444748] px-2 py-1">
        <span className="text-[#8e9192] uppercase text-[10px] font-mono-data">Prazo:</span>
        <select
          value={filters.deadlineSituation}
          onChange={(e) => setFilters((prev) => ({ ...prev, deadlineSituation: e.target.value }))}
          className="bg-transparent text-[#e2e2e2] focus:outline-none cursor-pointer"
        >
          <option value="Todas" className="bg-[#1e2020] text-[#e2e2e2]">Todas Situações</option>
          <option value="No Prazo" className="bg-[#1e2020] text-[#4ae183]">No Prazo</option>
          <option value="Atenção" className="bg-[#1e2020] text-[#92ccff]">Atenção (&le; 3 dias)</option>
          <option value="Atrasado" className="bg-[#1e2020] text-[#ffb4ab]">Atrasado</option>
          <option value="Concluído" className="bg-[#1e2020] text-[#c4c7c7]">Concluído</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-1 bg-[#0c0f0f] border-b border-[#444748] px-2 py-1">
        <span className="text-[#8e9192] uppercase text-[10px] font-mono-data">Prioridade:</span>
        <select
          value={filters.priority}
          onChange={(e) => setFilters((prev) => ({ ...prev, priority: e.target.value }))}
          className="bg-transparent text-[#e2e2e2] focus:outline-none cursor-pointer"
        >
          <option value="Todas" className="bg-[#1e2020] text-[#e2e2e2]">Todas Prioridades</option>
          <option value="Baixa" className="bg-[#1e2020] text-[#e2e2e2]">Baixa</option>
          <option value="Média" className="bg-[#1e2020] text-[#e2e2e2]">Média</option>
          <option value="Alta" className="bg-[#1e2020] text-[#e2e2e2]">Alta</option>
          <option value="Urgente" className="bg-[#1e2020] text-[#ffb4ab]">Urgente</option>
        </select>
      </div>

      {/* Responsible Filter */}
      {availableResponsibles.length > 0 && (
        <div className="flex items-center gap-1 bg-[#0c0f0f] border-b border-[#444748] px-2 py-1">
          <span className="text-[#8e9192] uppercase text-[10px] font-mono-data">Quem:</span>
          <select
            value={filters.who}
            onChange={(e) => setFilters((prev) => ({ ...prev, who: e.target.value }))}
            className="bg-transparent text-[#e2e2e2] focus:outline-none cursor-pointer max-w-[120px] truncate"
          >
            <option value="Todos" className="bg-[#1e2020] text-[#e2e2e2]">Todos Responsáveis</option>
            {availableResponsibles.map((resp) => (
              <option key={resp} value={resp} className="bg-[#1e2020] text-[#e2e2e2]">
                {resp}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Reset, Counter & New Task Action */}
      <div className="ml-auto flex items-center gap-2.5">
        <span className="text-[11px] font-mono-data text-[#c4c7c7] hidden sm:inline">
          {totalFilteredCount} de {totalCount} tarefas
        </span>
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2.5 py-1 border border-[#444748] bg-[#121414] hover:bg-[#282a2b] text-[#e2e2e2] text-[11px] uppercase tracking-wider font-mono-data transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-[#ffb4ab]" />
            <span>Limpar</span>
          </button>
        )}
        {openCreateModal && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1 border border-[#4ae183] bg-[#4ae183] text-[#003919] hover:bg-[#6bfe9c] font-bold text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm cursor-pointer"
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
