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
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col overflow-y-auto bg-[#121414]">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 flex-wrap gap-2 border-b border-[#444748]">
        <div>
          <h2 className="text-sm font-bold text-[#e2e2e2] uppercase tracking-wider font-mono-data">
            Cartões 5W2H
          </h2>
          <p className="text-[11px] text-[#8e9192]">
            Visualização em grade de planos de ação
          </p>
        </div>
        {openCreateModal && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#4ae183] bg-[#4ae183] text-[#003919] hover:bg-[#6bfe9c] font-bold text-xs uppercase tracking-wider transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nova Tarefa</span>
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 p-8 text-center text-[#8e9192] font-mono-data flex flex-col items-center justify-center">
          <HelpCircle className="w-12 h-12 mb-3 text-[#444748]" />
          <p className="text-sm">Nenhum cartão 5W2H encontrado para os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1">
        {tasks.map((t) => {
          const calc = calculateTaskDeadlineInfo(
            t.deadlineDate,
            t.status,
            workspaceConfig.attentionThresholdDays
          );

          return (
            <div
              key={t.id}
              className="bg-[#1a1c1c] border border-[#444748] flex flex-col justify-between hover:border-[#8e9192] transition-colors relative"
            >
              {/* Card Header */}
              <div className="p-4 border-b border-[#444748] bg-[#1e2020]">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="text-[10px] font-mono-data text-[#8e9192] uppercase">
                    {t.id} • {t.department}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] uppercase font-bold font-mono-data border ${
                      t.priority === 'Urgente'
                        ? 'bg-[#93000a] text-[#ffb4ab] border-[#ffb4ab]'
                        : t.priority === 'Alta'
                        ? 'bg-[#121414] text-[#ffb4ab] border-[#ffb4ab]'
                        : 'bg-[#121414] text-[#92ccff] border-[#004b73]'
                    }`}
                  >
                    {t.priority}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-[#e2e2e2] leading-snug line-clamp-2">
                  {t.title}
                </h3>
              </div>

              {/* 5W2H Matrix Grid inside Card */}
              <div className="p-4 space-y-3 text-xs font-body-md flex-1">
                {/* Why & How */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="bg-[#121414] p-2 border border-[#444748]">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#92ccff] font-mono-data uppercase mb-1">
                      <Brain className="w-3 h-3" />
                      <span>Por quê (Justificativa)</span>
                    </div>
                    <p className="text-[#c4c7c7] text-[11px] line-clamp-2">{t.why}</p>
                  </div>

                  <div className="bg-[#121414] p-2 border border-[#444748]">
                    <div className="flex items-center gap-1.5 text-[10px] text-[#c8c6c5] font-mono-data uppercase mb-1">
                      <Wrench className="w-3 h-3" />
                      <span>Como (Método)</span>
                    </div>
                    <p className="text-[#c4c7c7] text-[11px] line-clamp-2">{t.how}</p>
                  </div>
                </div>

                {/* Where, Who, When, How Much Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-data">
                  <div className="bg-[#121414] p-2 border border-[#444748]">
                    <span className="text-[9px] text-[#8e9192] block uppercase">Onde</span>
                    <span className="text-[#e2e2e2] truncate block">{t.where}</span>
                  </div>

                  <div className="bg-[#121414] p-2 border border-[#444748]">
                    <span className="text-[9px] text-[#8e9192] block uppercase">Quem</span>
                    <span className="text-[#e2e2e2] truncate block font-bold">{t.who}</span>
                  </div>

                  <div className="bg-[#121414] p-2 border border-[#444748]">
                    <span className="text-[9px] text-[#8e9192] block uppercase">Prazo</span>
                    <span className="text-[#e2e2e2] block">{formatShortDate(t.deadlineDate)}</span>
                    <span
                      className={`text-[9px] font-bold block ${
                        calc.deadlineSituation === 'Atrasado'
                          ? 'text-[#ffb4ab]'
                          : calc.deadlineSituation === 'Atenção'
                          ? 'text-[#92ccff]'
                          : 'text-[#4ae183]'
                      }`}
                    >
                      {calc.deadlineSituation}
                    </span>
                  </div>

                  <div className="bg-[#121414] p-2 border border-[#444748]">
                    <span className="text-[9px] text-[#8e9192] block uppercase">Quanto</span>
                    <span className="text-[#4ae183] font-bold block">
                      {formatCurrency(t.howMuch, workspaceConfig.currencySymbol)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress & Quick Actions Footer */}
              <div className="p-3 border-t border-[#444748] bg-[#1e2020] flex items-center justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono-data text-[#c4c7c7]">
                    <span>{t.status}</span>
                    <span className="font-bold">{t.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-[#333535] h-1.5 border border-[#444748]">
                    <div
                      className={`h-full ${
                        t.status === 'Concluído'
                          ? 'bg-[#4ae183]'
                          : t.status === 'Atrasado'
                          ? 'bg-[#ffb4ab]'
                          : 'bg-[#92ccff]'
                      }`}
                      style={{ width: `${t.progressPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => openMatrixModal(t)}
                    title="Inspecionar Matriz"
                    className="p-1.5 bg-[#121414] border border-[#444748] hover:border-[#92ccff] text-[#92ccff] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openEditModal(t)}
                    title="Editar"
                    className="p-1.5 bg-[#121414] border border-[#444748] hover:border-[#4ae183] text-[#c4c7c7] hover:text-[#4ae183] transition-colors"
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
                    className="p-1.5 bg-[#121414] border border-[#444748] hover:border-[#ffb4ab] text-[#c4c7c7] hover:text-[#ffb4ab] transition-colors"
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
