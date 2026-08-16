'use client';

import React from 'react';
import { Task5W2H, WorkspaceConfig, TaskStatus } from '@/types/5w2h';
import { calculateTaskDeadlineInfo, formatCurrency, formatShortDate } from '@/lib/5w2h-utils';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Eye,
  Edit2,
  ArrowRight,
  ArrowLeft,
  Plus,
} from 'lucide-react';

interface TaskKanbanViewProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
  openEditModal: (task: Task5W2H) => void;
  openMatrixModal: (task: Task5W2H) => void;
  changeTaskStatus: (id: string, newStatus: TaskStatus) => void;
  openCreateModal?: () => void;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  tasks,
  workspaceConfig,
  openEditModal,
  openMatrixModal,
  changeTaskStatus,
  openCreateModal,
}) => {
  const columns: { status: TaskStatus; label: string; color: string; icon: any }[] = [
    { status: 'Não iniciado', label: 'Não Iniciado', color: 'var(--muted-foreground)', icon: HelpCircle },
    { status: 'Em andamento', label: 'Em Andamento', color: 'var(--info)', icon: Clock },
    { status: 'Concluído', label: 'Concluído', color: 'var(--primary)', icon: CheckCircle2 },
    { status: 'Atrasado', label: 'Atrasado', color: 'var(--destructive)', icon: AlertTriangle },
    { status: 'Cancelado', label: 'Cancelado', color: 'var(--border)', icon: XCircle },
  ];

  const tasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  return (
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col overflow-x-auto bg-background">
      {/* View Header */}
      <div className="flex items-center justify-between pb-3 mb-3 flex-wrap gap-2 border-b border-border shrink-0">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono-data">
            Quadro Kanban 5W2H
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Acompanhamento de fluxo por status de execução
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

      <div className="flex gap-4 min-w-[1250px] flex-1 items-start">
        {columns.map((col) => {
          const colTasks = tasksByStatus(col.status);
          const Icon = col.icon;

          return (
            <div
              key={col.status}
              className="w-72 bg-card border border-border flex flex-col shrink-0 max-h-[calc(100vh-180px)]"
            >
              {/* Column Header */}
              <div
                className="p-3 border-b border-border bg-card flex items-center justify-between sticky top-0 z-10"
                style={{ borderTop: `3px solid ${col.color}` }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: col.color }} />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
                    {col.label}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-background border border-border text-muted-foreground text-[10px] font-mono-data font-bold">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Body / Task Cards */}
              <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                {colTasks.length === 0 ? (
                  <div className="p-4 border border-dashed border-border text-center text-muted-foreground text-[11px] font-mono-data my-2">
                    Nenhuma tarefa
                  </div>
                ) : (
                  colTasks.map((t, idx) => {
                    const calc = calculateTaskDeadlineInfo(
                      t.deadlineDate,
                      t.status,
                      workspaceConfig.attentionThresholdDays
                    );

                    return (
                      <div
                        key={`${t.id}-${idx}`}
                        className="bg-background border border-border p-3 hover:border-primary/50 transition-all space-y-2 group"
                      >
                        {/* Header ID & Priority */}
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono-data text-muted-foreground">{t.id}</span>
                          <span
                            className={`px-1 text-[9px] font-mono-data uppercase font-bold border ${
                              t.priority === 'Urgente'
                                ? 'bg-destructive text-destructive-foreground border-destructive'
                                : t.priority === 'Alta'
                                ? 'text-destructive border-destructive font-semibold'
                                : 'text-muted-foreground border-border'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-xs text-foreground leading-snug line-clamp-2">
                          {t.title}
                        </h4>

                        {/* Assignee & Dept */}
                        <div className="text-[10px] text-muted-foreground font-mono-data flex justify-between">
                          <span>👤 {t.who}</span>
                          <span className="text-muted-foreground truncate max-w-[100px]">{t.category}</span>
                        </div>

                        {/* Deadline & Cost */}
                        <div className="flex items-center justify-between text-[10px] font-mono-data pt-1 border-t border-border">
                          <span className="text-muted-foreground">📅 {formatShortDate(t.deadlineDate)}</span>
                          <span className="text-primary font-bold">
                            {formatCurrency(t.howMuch, workspaceConfig.currencySymbol)}
                          </span>
                        </div>

                        {/* Action Bar (Move & Inspect) */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openMatrixModal(t)}
                              title="Inspecionar Matriz"
                              className="p-1 hover:bg-muted text-info transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(t)}
                              title="Editar"
                              className="p-1 hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Status Shift Buttons */}
                          <div className="flex gap-1">
                            {col.status !== 'Não iniciado' && (
                              <button
                                onClick={() => {
                                  const idx = columns.findIndex((c) => c.status === col.status);
                                  if (idx > 0) changeTaskStatus(t.id, columns[idx - 1].status);
                                }}
                                title="Voltar Status"
                                className="p-1 border border-border bg-card hover:bg-muted text-muted-foreground cursor-pointer transition-colors"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {col.status !== 'Cancelado' && (
                              <button
                                onClick={() => {
                                  const idx = columns.findIndex((c) => c.status === col.status);
                                  if (idx < columns.length - 1)
                                    changeTaskStatus(t.id, columns[idx + 1].status);
                                }}
                                title="Avançar Status"
                                className="p-1 border border-border bg-card hover:bg-muted text-primary cursor-pointer transition-colors"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
