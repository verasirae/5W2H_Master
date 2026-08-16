'use client';

import React, { useState, useMemo } from 'react';
import { Task5W2H, WorkspaceConfig, TaskStatus } from '@/types/5w2h';
import { calculateTaskDeadlineInfo, formatCurrency, formatShortDate } from '@/lib/5w2h-utils';
import {
  ArrowUpDown,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface TaskTableViewProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
  openEditModal: (task: Task5W2H) => void;
  openMatrixModal: (task: Task5W2H) => void;
  deleteTask: (id: string) => void;
  changeTaskStatus: (id: string, newStatus: TaskStatus) => void;
  openCreateModal?: () => void;
}

type SortField = 'title' | 'deadlineDate' | 'status' | 'howMuch' | 'priority' | 'department';
type SortOrder = 'asc' | 'desc';

export const TaskTableView: React.FC<TaskTableViewProps> = ({
  tasks,
  workspaceConfig,
  openEditModal,
  openMatrixModal,
  deleteTask,
  changeTaskStatus,
  openCreateModal,
}) => {
  const [sortField, setSortField] = useState<SortField>('deadlineDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'howMuch') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else {
        valA = (valA || '').toString().toLowerCase();
        valB = (valB || '').toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedTasks.length / pageSize) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, currentPage, pageSize]);

  const priorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return <span className="px-1.5 py-0.5 bg-destructive text-destructive-foreground border border-destructive text-[10px] uppercase font-bold font-mono-data">URGENTE</span>;
      case 'Alta':
        return <span className="px-1.5 py-0.5 bg-card text-destructive border border-destructive text-[10px] uppercase font-mono-data font-semibold">ALTA</span>;
      case 'Média':
        return <span className="px-1.5 py-0.5 bg-card text-info border border-info text-[10px] uppercase font-mono-data font-medium">MÉDIA</span>;
      default:
        return <span className="px-1.5 py-0.5 bg-card text-muted-foreground border border-border text-[10px] uppercase font-mono-data">BAIXA</span>;
    }
  };

  return (
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col overflow-hidden bg-background">
      {/* View Header with Nova Tarefa Action */}
      <div className="flex items-center justify-between pb-3 mb-2 flex-wrap gap-2 border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono-data">
            Lista de Tarefas 5W2H
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Tabela interativa de planos de ação
          </p>
        </div>
        {openCreateModal && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-primary bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Tarefa</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="flex-1 w-full overflow-x-auto border border-border bg-background relative">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1100px]">
          <thead className="bg-card sticky top-0 z-10 border-b border-border">
            <tr className="text-[11px] font-mono-data text-muted-foreground uppercase tracking-wider">
              <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('title')}>
                <div className="flex items-center gap-1">
                  <span>O quê (Título)</span>
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                </div>
              </th>
              <th className="px-3 py-3">Por quê / Onde</th>
              <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('department')}>
                <div className="flex items-center gap-1">
                  <span>Depto / Categoria</span>
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                </div>
              </th>
              <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('deadlineDate')}>
                <div className="flex items-center gap-1">
                  <span>Quando (Prazo)</span>
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                </div>
              </th>
              <th className="px-3 py-3">Quem</th>
              <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
                <div className="flex items-center gap-1">
                  <span>Status (% Concl.)</span>
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                </div>
              </th>
              <th className="px-3 py-3 cursor-pointer hover:text-foreground" onClick={() => handleSort('howMuch')}>
                <div className="flex items-center gap-1">
                  <span>Quanto (Custo)</span>
                  <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                </div>
              </th>
              <th className="px-3 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono-data text-xs text-foreground">
            {paginatedTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground font-mono-data">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Nenhuma tarefa 5W2H encontrada para os filtros aplicados.
                </td>
              </tr>
            ) : (
              paginatedTasks.map((t, index) => {
                const calc = calculateTaskDeadlineInfo(
                  t.deadlineDate,
                  t.status,
                  workspaceConfig.attentionThresholdDays
                );

                return (
                  <tr
                    key={`${t.id}-${index}`}
                    className="hover:bg-muted transition-colors group cursor-default"
                  >
                    {/* O quê (Title) */}
                    <td className="px-3 py-3 max-w-[220px]">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground truncate" title={t.title}>
                          {t.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono-data">{t.id}</span>
                          {priorityBadge(t.priority)}
                        </div>
                      </div>
                    </td>

                    {/* Por quê / Onde */}
                    <td className="px-3 py-3 max-w-[200px]">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-muted-foreground truncate" title={t.why}>
                          {t.why}
                        </span>
                        <span className="text-muted-foreground text-[10px] truncate" title={t.where}>
                          📍 {t.where}
                        </span>
                      </div>
                    </td>

                    {/* Depto / Categoria */}
                    <td className="px-3 py-3 max-w-[160px]">
                      <div className="flex flex-col text-[11px]">
                        <span className="text-foreground truncate font-medium">{t.department}</span>
                        <span className="text-muted-foreground text-[10px] truncate">{t.category}</span>
                      </div>
                    </td>

                    {/* Quando (Deadline) */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="text-foreground">{formatShortDate(t.deadlineDate)}</span>
                        {calc.deadlineSituation === 'Atrasado' && (
                          <span className="text-[10px] font-bold text-destructive-foreground bg-destructive px-1 py-0.2 uppercase w-fit mt-0.5">
                            Atrasado ({Math.abs(calc.daysRemaining)}d)
                          </span>
                        )}
                        {calc.deadlineSituation === 'Atenção' && (
                          <span className="text-[10px] font-bold text-info bg-info/10 border border-info/40 px-1 py-0.2 uppercase w-fit mt-0.5">
                            Atenção ({calc.daysRemaining}d)
                          </span>
                        )}
                        {calc.deadlineSituation === 'No Prazo' && (
                          <span className="text-[10px] text-primary font-mono-data mt-0.5 font-medium">
                            No Prazo ({calc.daysRemaining}d)
                          </span>
                        )}
                        {calc.deadlineSituation === 'Concluído' && (
                          <span className="text-[10px] text-muted-foreground font-mono-data mt-0.5">
                            Concluído
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Quem */}
                    <td className="px-3 py-3 text-muted-foreground font-medium">{t.who}</td>

                    {/* Status (% Concl) */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <select
                          value={t.status}
                          onChange={(e) => changeTaskStatus(t.id, e.target.value as TaskStatus)}
                          className="bg-background border border-input text-[11px] font-mono-data text-foreground py-0.5 px-1 focus:border-primary focus:outline-none cursor-pointer"
                        >
                          <option value="Não iniciado" className="bg-popover text-foreground">Não iniciado</option>
                          <option value="Em andamento" className="bg-popover text-foreground">Em andamento</option>
                          <option value="Concluído" className="bg-popover text-foreground">Concluído</option>
                          <option value="Atrasado" className="bg-popover text-foreground">Atrasado</option>
                          <option value="Cancelado" className="bg-popover text-foreground">Cancelado</option>
                        </select>
                        <div className="w-24 bg-muted h-1.5 border border-border">
                          <div
                            className={`h-full ${
                              t.status === 'Concluído'
                                ? 'bg-primary'
                                : t.status === 'Atrasado'
                                ? 'bg-destructive'
                                : 'bg-info'
                            }`}
                            style={{ width: `${t.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>

                    {/* Quanto (Custo) */}
                    <td className="px-3 py-3 text-primary font-bold">
                      {formatCurrency(t.howMuch, workspaceConfig.currencySymbol)}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => openMatrixModal(t)}
                          title="Inspecionar Matriz 5W2H"
                          className="p-1 hover:bg-muted text-info transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(t)}
                          title="Editar Tarefa"
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja excluir a tarefa "${t.title}"?`)) {
                              deleteTask(t.id);
                            }
                          }}
                          title="Excluir Tarefa"
                          className="p-1 hover:bg-muted text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs font-mono-data text-muted-foreground">
        <span>
          Página {currentPage} de {totalPages} ({sortedTasks.length} tarefas)
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 border border-border bg-card disabled:opacity-30 hover:bg-muted text-foreground cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-1.5 border border-border bg-card disabled:opacity-30 hover:bg-muted text-foreground cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
