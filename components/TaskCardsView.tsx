'use client';

import React from 'react';
import { Task5W2H, WorkspaceConfig, TaskStatus } from '@/types/5w2h';
import { calculateTaskDeadlineInfo, formatCurrency, formatShortDate } from '@/lib/5w2h-utils';
import {
  HelpCircle,
  Brain,
  MapPin,
  Calendar,
  User,
  Wrench,
  DollarSign,
  Eye,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';

interface TaskCardsViewProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
  openEditModal: (task: Task5W2H) => void;
  openMatrixModal: (task: Task5W2H) => void;
  deleteTask: (id: string) => void;
  changeTaskStatus: (id: string, newStatus: TaskStatus) => void;
  openCreateModal?: () => void;
}

export const TaskCardsView: React.FC<TaskCardsViewProps> = ({
  tasks,
  workspaceConfig,
  openEditModal,
  openMatrixModal,
  deleteTask,
  changeTaskStatus,
  openCreateModal,
}) => {
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-primary bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Tarefa</span>
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 p-8 text-center text-muted-foreground font-mono-data flex flex-col items-center justify-center">
          <HelpCircle className="w-12 h-12 mb-3 text-muted-foreground" />
          <p className="text-sm">Nenhum cartão 5W2H encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1">
        {tasks.map((t, idx) => {
          const calc = calculateTaskDeadlineInfo(
            t.deadlineDate,
            t.status,
            workspaceConfig.attentionThresholdDays
          );

          return (
            <div
              key={`${t.id}-${idx}`}
              className="bg-card border border-border flex flex-col justify-between hover:border-primary/50 transition-colors relative"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-border bg-card">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-mono-data text-muted-foreground uppercase">
                    {t.id} • {t.department}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] uppercase font-bold font-mono-data border ${
                      t.priority === 'Urgente'
                        ? 'bg-destructive text-destructive-foreground border-destructive'
                        : t.priority === 'Alta'
                        ? 'bg-card text-destructive border-destructive font-semibold'
                        : 'bg-card text-info border-info font-medium'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-2">
                  {t.title}
                </h3>
              </div>

              {/* 5W2H Matrix Grid inside Card */}
              <div className="p-4 space-y-3 text-xs font-body-md flex-1">
                {/* Why & How */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-background p-2 border border-border">
                    <div className="flex items-center gap-1.5 text-[10px] text-info font-mono-data uppercase mb-1 font-semibold">
                      <Brain className="w-3 h-3" />
                      <span>Por quê (Justificativa)</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] line-clamp-2">{t.why}</p>
                  </div>

                  <div className="bg-background p-2 border border-border">
                    <div className="flex items-center gap-1.5 text-[10px] text-foreground font-mono-data uppercase mb-1 font-semibold">
                      <Wrench className="w-3 h-3" />
                      <span>Como (Método)</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] line-clamp-2">{t.how}</p>
                  </div>
                </div>

                {/* Where, Who, When, How Much Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-data">
                  <div className="bg-background p-2 border border-border">
                    <span className="text-[9px] text-muted-foreground block uppercase">Onde</span>
                    <span className="text-foreground truncate block">{t.where}</span>
                  </div>

                  <div className="bg-background p-2 border border-border">
                    <span className="text-[9px] text-muted-foreground block uppercase">Quem</span>
                    <span className="text-foreground truncate block font-bold">{t.who}</span>
                  </div>

                  <div className="bg-background p-2 border border-border">
                    <span className="text-[9px] text-muted-foreground block uppercase">Prazo</span>
                    <span className="text-foreground block">{formatShortDate(t.deadlineDate)}</span>
                    <span
                      className={`text-[9px] font-bold block ${
                        calc.deadlineSituation === 'Atrasado'
                          ? 'text-destructive'
                          : calc.deadlineSituation === 'Atenção'
                          ? 'text-info'
                          : 'text-primary'
                      }`}
                    >
                      {calc.deadlineSituation}
                    </span>
                  </div>

                  <div className="bg-background p-2 border border-border">
                    <span className="text-[9px] text-muted-foreground block uppercase">Quanto</span>
                    <span className="text-primary font-bold block">
                      {formatCurrency(t.howMuch, workspaceConfig.currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress & Quick Actions Footer */}
              <div className="p-3 border-t border-border bg-card flex items-center justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono-data text-muted-foreground">
                    <span>{t.status}</span>
                    <span className="font-bold text-foreground">{t.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-muted h-1.5 border border-border">
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
                    className="p-1.5 bg-background border border-border hover:border-info text-info transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(t)}
                    title="Editar"
                    className="p-1.5 bg-background border border-border hover:border-primary text-muted-foreground hover:text-primary transition-colors cursor-pointer"
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
                    className="p-1.5 bg-background border border-border hover:border-destructive text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
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
