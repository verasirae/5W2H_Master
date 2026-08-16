'use client';

import React from 'react';
import { Task5W2H, WorkspaceConfig, TaskStatus } from '@/types/5w2h';
import { calculateTaskDeadlineInfo, formatCurrency, formatShortDate } from '@/lib/5w2h-utils';
import {
  HelpCircle,
  Brain,
  Wrench,
  Eye,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';

interface TaskCardsViewProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
  openEditModal: (task: Task5W2H) => void;
  openMatrixModal: (task: Task5W2H) => void;
  deleteTask: (id: string) => void;
  changeTaskStatus: (id: string, newStatus: TaskStatus) => void;
  openCreateModal?: () => void;
  isLoading?: boolean;
}

export const TaskCardsView: React.FC<TaskCardsViewProps> = ({
  tasks,
  workspaceConfig,
  openEditModal,
  openMatrixModal,
  deleteTask,
  openCreateModal,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-7xl mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border p-4 rounded-md space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-14 w-full" />
              <div className="pt-2 border-t border-border flex justify-between items-center">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
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
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col overflow-y-auto bg-background">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 flex-wrap gap-2 border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider font-mono-data">
            Cartões 5W2H
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Visualização em grade de planos de ação
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

      {tasks.length === 0 ? (
        <div className="flex-1 p-8 text-center text-muted-foreground font-mono-data flex flex-col items-center justify-center">
          <HelpCircle className="w-12 h-12 mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm">Nenhum cartão 5W2H encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1 pb-4">
          {tasks.map((t, idx) => {
            const calc = calculateTaskDeadlineInfo(
              t.deadlineDate,
              t.status,
              workspaceConfig.attentionThresholdDays
            );

            return (
              <div
                key={`${t.id}-${idx}`}
                className="bg-card border border-border rounded-md flex flex-col justify-between hover:border-primary/50 transition-all relative shadow-sm"
              >
                {/* Card Header */}
                <div className="p-3.5 border-b border-border bg-card rounded-t-md">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <span className="text-[10px] font-mono-data text-muted-foreground uppercase">
                      {t.id} • {t.department}
                    </span>
                    {renderPriorityBadge(t.priority)}
                  </div>
                  <h3 className="font-bold text-xs text-foreground leading-snug line-clamp-2">
                    {t.title}
                  </h3>
                </div>

                {/* 5W2H Matrix Grid inside Card */}
                <div className="p-3.5 space-y-2.5 text-xs font-body-md flex-1">
                  {/* Why & How */}
                  <div className="grid grid-cols-1 gap-2">
                    <div className="bg-background p-2 border border-border rounded-md">
                      <div className="flex items-center gap-1.5 text-[9px] text-info font-mono-data uppercase mb-0.5 font-semibold">
                        <Brain className="w-3 h-3" />
                        <span>Por quê (Justificativa)</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] line-clamp-2">{t.why}</p>
                    </div>

                    <div className="bg-background p-2 border border-border rounded-md">
                      <div className="flex items-center gap-1.5 text-[9px] text-foreground font-mono-data uppercase mb-0.5 font-semibold">
                        <Wrench className="w-3 h-3" />
                        <span>Como (Método)</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] line-clamp-2">{t.how}</p>
                    </div>
                  </div>

                  {/* Where, Who, When, How Much Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-data">
                    <div className="bg-background p-2 border border-border rounded-md">
                      <span className="text-[9px] text-muted-foreground block uppercase">Onde</span>
                      <span className="text-foreground truncate block">{t.where}</span>
                    </div>

                    <div className="bg-background p-2 border border-border rounded-md">
                      <span className="text-[9px] text-muted-foreground block uppercase">Quem</span>
                      <span className="text-foreground truncate block font-bold">{t.who}</span>
                    </div>

                    <div className="bg-background p-2 border border-border rounded-md">
                      <span className="text-[9px] text-muted-foreground block uppercase">Prazo</span>
                      <span className="text-foreground block">{formatShortDate(t.deadlineDate)}</span>
                      <div className="mt-0.5">
                        {calc.deadlineSituation === 'Atrasado' && (
                          <span className="text-[9px] font-semibold text-red-700 dark:text-red-400 bg-red-500/15 border border-red-500/25 px-1 py-0.2 rounded uppercase block w-fit">
                            Atrasado ({Math.abs(calc.daysRemaining)}d)
                          </span>
                        )}
                        {calc.deadlineSituation === 'Atenção' && (
                          <span className="text-[9px] font-medium text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/25 px-1 py-0.2 rounded uppercase block w-fit">
                            Atenção ({calc.daysRemaining}d)
                          </span>
                        )}
                        {calc.deadlineSituation === 'No Prazo' && (
                          <span className="text-[9px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1 py-0.2 rounded uppercase block w-fit">
                            No Prazo
                          </span>
                        )}
                        {calc.deadlineSituation === 'Concluído' && (
                          <span className="text-[9px] text-muted-foreground bg-muted border border-border px-1 py-0.2 rounded uppercase block w-fit font-mono-data">
                            Concluído
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-background p-2 border border-border rounded-md">
                      <span className="text-[9px] text-muted-foreground block uppercase">Quanto</span>
                      <span className="text-primary font-bold block">
                        {formatCurrency(t.howMuch, workspaceConfig.currencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress & Quick Actions Footer */}
                <div className="p-3 border-t border-border bg-card rounded-b-md flex items-center justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono-data text-muted-foreground">
                      <span>{t.status}</span>
                      <span className="font-bold text-foreground">{t.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-muted h-1.5 border border-border rounded-full overflow-hidden">
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

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <button
                      onClick={() => openMatrixModal(t)}
                      title="Inspecionar Matriz"
                      className="p-1.5 bg-background border border-border hover:border-info text-info transition-colors cursor-pointer rounded-md"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(t)}
                      title="Editar"
                      className="p-1.5 bg-background border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-md"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir "${t.title}"?`)) {
                          deleteTask(t.id);
                        }
                      }}
                      title="Excluir"
                      className="p-1.5 bg-background border border-border hover:border-destructive text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
