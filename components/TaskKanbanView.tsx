'use client';

import React, { useState } from 'react';
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
  GripVertical,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

interface TaskKanbanViewProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
  openEditModal: (task: Task5W2H) => void;
  openMatrixModal: (task: Task5W2H) => void;
  changeTaskStatus: (id: string, newStatus: TaskStatus) => void;
  openCreateModal?: () => void;
  isLoading?: boolean;
}

export const TaskKanbanView: React.FC<TaskKanbanViewProps> = ({
  tasks,
  workspaceConfig,
  openEditModal,
  openMatrixModal,
  changeTaskStatus,
  openCreateModal,
  isLoading = false,
}) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-x-auto p-4 md:p-6 w-full">
        <div className="flex gap-4 min-w-[1100px] h-full items-start">
          {Array.from({ length: 5 }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="flex-1 bg-muted/20 border border-border rounded-md p-3 space-y-3 min-w-[210px]"
            >
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-3.5 h-3.5 rounded-full" />
                  <Skeleton className="w-24 h-3.5" />
                </div>
                <Skeleton className="w-6 h-4 rounded-full" />
              </div>
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="bg-card border border-border p-3 rounded-md space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <Skeleton className="w-14 h-3 rounded" />
                      <Skeleton className="w-12 h-3 rounded-full" />
                    </div>
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-3/4 h-3" />
                    <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                      <Skeleton className="w-16 h-3" />
                      <Skeleton className="w-12 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== status) {
      setDragOverCol(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    // Only clear if leaving the main column container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverCol === status) {
      setDragOverCol(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      changeTaskStatus(taskId, status);
    }
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Urgente':
        return (
          <span className="px-1.5 py-0.5 bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/25 text-[9px] uppercase font-bold font-mono-data rounded-md">
            Urgente
          </span>
        );
      case 'Alta':
        return (
          <span className="px-1.5 py-0.5 bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/25 text-[9px] uppercase font-mono-data font-semibold rounded-md">
            Alta
          </span>
        );
      case 'Média':
        return (
          <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 text-[9px] uppercase font-mono-data font-medium rounded-md">
            Média
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-500/20 text-[9px] uppercase font-mono-data rounded-md">
            Baixa
          </span>
        );
    }
  };

  return (
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col bg-background">
      {/* View Header */}
      <div className="flex items-center justify-between pb-3 mb-3 flex-wrap gap-2 border-b border-border shrink-0">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono-data">
            Quadro Kanban 5W2H
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Acompanhamento de fluxo por status de execução (Arraste e solte para alterar status)
          </p>
        </div>
        {openCreateModal && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-primary bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm cursor-pointer rounded-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Tarefa</span>
          </button>
        )}
      </div>

      {/* Kanban Board Columns */}
      <div className="flex gap-4 min-w-[1250px] flex-1 items-start pb-4 overflow-x-auto md:pr-3">
        {columns.map((col) => {
          const colTasks = tasksByStatus(col.status);
          const Icon = col.icon;
          const isOver = dragOverCol === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={(e) => handleDragLeave(e, col.status)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`w-72 bg-card border rounded-md flex flex-col shrink-0 max-h-[calc(100vh-180px)] transition-all duration-200 ${
                isOver
                  ? 'border-primary ring-2 ring-primary/25 bg-primary/5 shadow-md'
                  : 'border-border'
              }`}
            >
              {/* Column Header */}
              <div
                className="p-3 border-b border-border bg-card flex items-center justify-between sticky top-0 z-10 rounded-t-md"
                style={{ borderTop: `3px solid ${col.color}` }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: col.color }} />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
                    {col.label}
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-background border border-border text-muted-foreground text-[10px] font-mono-data font-bold rounded-md">
                  {colTasks.length}
                </span>
              </div>

              {/* Column Body / Droppable Area */}
              <div className="p-2 space-y-2.5 overflow-y-auto flex-1 min-h-[140px]">
                {colTasks.length === 0 ? (
                  <div
                    className={`p-4 border border-dashed text-center text-muted-foreground text-[11px] font-mono-data my-2 rounded-md transition-colors ${
                      isOver ? 'border-primary text-primary bg-primary/10' : 'border-border'
                    }`}
                  >
                    {isOver ? 'Solte para mover aqui' : 'Nenhuma tarefa'}
                  </div>
                ) : (
                  colTasks.map((t, idx) => {
                    const isBeingDragged = draggedTaskId === t.id;
                    const calc = calculateTaskDeadlineInfo(
                      t.deadlineDate,
                      t.status,
                      workspaceConfig.attentionThresholdDays
                    );

                    return (
                      <div
                        key={`${t.id}-${idx}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onDragEnd={handleDragEnd}
                        className={`bg-background border rounded-md p-3 transition-all space-y-2 group cursor-grab active:cursor-grabbing select-none ${
                          isBeingDragged
                            ? 'opacity-40 border-dashed border-primary scale-[0.98] shadow-inner'
                            : 'border-border hover:border-primary/50 hover:shadow-sm'
                        }`}
                      >
                        {/* Header ID, Drag Grip & Priority */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <GripVertical className="w-3 h-3 text-muted-foreground/60 group-hover:text-muted-foreground" />
                            <span className="text-[9px] font-mono-data text-muted-foreground">{t.id}</span>
                          </div>
                          {renderPriorityBadge(t.priority)}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-xs text-foreground leading-snug line-clamp-2">
                          {t.title}
                        </h4>

                        {/* Assignee & Category */}
                        <div className="text-[10px] text-muted-foreground font-mono-data flex justify-between">
                          <span className="truncate max-w-[120px]">👤 {t.who}</span>
                          <span className="text-muted-foreground truncate max-w-[100px]">{t.category}</span>
                        </div>

                        {/* Deadline & Cost */}
                        <div className="flex items-center justify-between text-[10px] font-mono-data pt-1 border-t border-border">
                          <span className="text-muted-foreground">📅 {formatShortDate(t.deadlineDate)}</span>
                          <span className="text-primary font-bold">
                            {formatCurrency(t.howMuch, workspaceConfig.currencySymbol)}
                          </span>
                        </div>

                        {/* Situation badge if attention or overdue */}
                        {calc.deadlineSituation === 'Atrasado' && (
                          <div className="text-[9px] font-semibold text-red-700 dark:text-red-400 bg-red-500/15 border border-red-500/25 px-1.5 py-0.5 uppercase rounded-md font-mono-data w-fit">
                            Atrasado ({Math.abs(calc.daysRemaining)}d)
                          </div>
                        )}
                        {calc.deadlineSituation === 'Atenção' && (
                          <div className="text-[9px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 uppercase rounded-md font-mono-data w-fit">
                            Atenção ({calc.daysRemaining}d)
                          </div>
                        )}

                        {/* Action Bar (Move & Inspect) */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openMatrixModal(t)}
                              title="Inspecionar Matriz"
                              className="p-1 hover:bg-muted text-info transition-colors cursor-pointer rounded"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditModal(t)}
                              title="Editar"
                              className="p-1 hover:bg-muted text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Status Shift Buttons */}
                          <div className="flex gap-1">
                            {col.status !== 'Não iniciado' && (
                              <button
                                onClick={() => {
                                  const cIdx = columns.findIndex((c) => c.status === col.status);
                                  if (cIdx > 0) changeTaskStatus(t.id, columns[cIdx - 1].status);
                                }}
                                title="Voltar Status"
                                className="p-1 border border-border bg-card hover:bg-muted text-muted-foreground cursor-pointer transition-colors rounded"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {col.status !== 'Cancelado' && (
                              <button
                                onClick={() => {
                                  const cIdx = columns.findIndex((c) => c.status === col.status);
                                  if (cIdx < columns.length - 1)
                                    changeTaskStatus(t.id, columns[cIdx + 1].status);
                                }}
                                title="Avançar Status"
                                className="p-1 border border-border bg-card hover:bg-muted text-primary cursor-pointer transition-colors rounded"
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
