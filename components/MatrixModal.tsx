'use client';

import React from 'react';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import { calculateTaskDeadlineInfo, formatCurrency, formatShortDate } from '@/lib/5w2h-utils';
import {
  X,
  Printer,
  Copy,
  Edit2,
  Trash2,
  HelpCircle,
  Brain,
  MapPin,
  Calendar,
  User,
  Wrench,
  DollarSign,
  FileText,
} from 'lucide-react';

interface MatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task5W2H | null;
  workspaceConfig: WorkspaceConfig;
  openEditModal: (task: Task5W2H) => void;
  deleteTask: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const MatrixModal: React.FC<MatrixModalProps> = ({
  isOpen,
  onClose,
  task,
  workspaceConfig,
  openEditModal,
  deleteTask,
  showToast,
}) => {
  if (!isOpen || !task) return null;

  const calc = calculateTaskDeadlineInfo(
    task.deadlineDate,
    task.status,
    workspaceConfig.attentionThresholdDays
  );

  const handleCopySummary = () => {
    const summary = `
=== PLANO DE AÇÃO 5W2H ===
Código: ${task.id}
Departamento: ${task.department} | Categoria: ${task.category} | Competência: ${task.competence}

1. O QUÊ (Título): ${task.title}
2. POR QUÊ (Justificativa): ${task.why}
3. ONDE (Local/Setor): ${task.where}
4. QUANDO (Prazo): ${formatShortDate(task.startDate)} até ${formatShortDate(task.deadlineDate)} (${calc.deadlineSituation})
5. QUEM (Responsável): ${task.who}
6. COMO (Método): ${task.how}
7. QUANTO (Custo): ${formatCurrency(task.howMuch, workspaceConfig.currencySymbol)}

Status: ${task.status} (${task.progressPercent}%)
Prioridade: ${task.priority}
Observações: ${task.observations || 'N/A'}
==========================
    `.trim();

    navigator.clipboard.writeText(summary);
    showToast('success', 'Copiado!', 'Resumo do plano 5W2H copiado para a área de transferência.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="bg-card border border-border w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
        {/* Modal Top Bar */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-card no-print shrink-0">
          <div>
            <span className="text-[10px] font-mono-data text-primary uppercase font-bold">
              Inspeção de Matriz 5W2H • ID: {task.id}
            </span>
            <h2 className="text-lg font-bold text-foreground leading-tight">{task.title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              title="Copiar Resumo 5W2H"
              className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border hover:border-info text-info text-xs font-mono-data uppercase transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copiar</span>
            </button>

            <button
              onClick={handlePrint}
              title="Imprimir Matriz 5W2H"
              className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border hover:border-primary text-primary text-xs font-mono-data uppercase transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={() => {
                onClose();
                openEditModal(task);
              }}
              title="Editar"
              className="p-1.5 bg-background border border-border hover:border-primary text-muted-foreground hover:text-primary cursor-pointer transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (confirm(`Excluir a tarefa "${task.title}"?`)) {
                  deleteTask(task.id);
                  onClose();
                }
              }}
              title="Excluir"
              className="p-1.5 bg-background border border-border hover:border-destructive text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Matrix Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-background print-matrix">
          {/* Status & Execution Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-card p-4 border border-border font-mono-data text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Departamento</span>
              <span className="font-bold text-foreground">{task.department}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Categoria</span>
              <span className="font-bold text-foreground">{task.category}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Competência</span>
              <span className="font-bold text-foreground">{task.competence}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Prioridade</span>
              <span className="font-bold text-destructive uppercase">{task.priority}</span>
            </div>
          </div>

          {/* 5W2H Bento Grid Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. WHAT */}
            <div className="md:col-span-2 bg-card border border-border p-4">
              <div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
                <HelpCircle className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-xs font-mono-data text-foreground uppercase">
                  1. O QUÊ (Título & Ação Core)
                </h3>
              </div>
              <p className="text-sm font-bold text-foreground leading-relaxed">{task.title}</p>
            </div>

            {/* 2. WHY */}
            <div className="bg-card border border-border p-4">
              <div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
                <Brain className="w-4 h-4 text-info" />
                <h3 className="font-bold text-xs font-mono-data text-foreground uppercase">
                  2. POR QUÊ (Justificativa)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{task.why}</p>
            </div>

            {/* 3. HOW */}
            <div className="bg-card border border-border p-4">
              <div className="flex items-center gap-2 border-b border-border pb-2 mb-3">
                <Wrench className="w-4 h-4 text-foreground" />
                <h3 className="font-bold text-xs font-mono-data text-foreground uppercase">
                  3. COMO (Procedimento / Método)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{task.how}</p>
            </div>

            {/* 4. WHERE */}
            <div className="bg-card border border-border p-4 font-mono-data">
              <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-xs text-foreground uppercase">4. ONDE (Local / Setor)</h3>
              </div>
              <p className="text-xs text-foreground">{task.where}</p>
            </div>

            {/* 5. WHO */}
            <div className="bg-card border border-border p-4 font-mono-data">
              <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                <User className="w-4 h-4 text-info" />
                <h3 className="font-bold text-xs text-foreground uppercase">5. QUEM (Responsável)</h3>
              </div>
              <p className="text-xs font-bold text-foreground">{task.who}</p>
            </div>

            {/* 6. WHEN */}
            <div className="bg-card border border-border p-4 font-mono-data">
              <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                <Calendar className="w-4 h-4 text-destructive" />
                <h3 className="font-bold text-xs text-foreground uppercase">6. QUANDO (Prazo)</h3>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Início: {formatShortDate(task.startDate)}</p>
                <p className="font-bold text-foreground">Prazo Final: {formatShortDate(task.deadlineDate)}</p>
                <p
                  className={`font-bold uppercase text-[11px] ${
                    calc.deadlineSituation === 'Atrasado'
                      ? 'text-destructive'
                      : calc.deadlineSituation === 'Atenção'
                      ? 'text-info'
                      : 'text-primary'
                  }`}
                >
                  SLA: {calc.deadlineSituation} ({calc.daysRemaining} dias)
                </p>
              </div>
            </div>

            {/* 7. HOW MUCH */}
            <div className="bg-card border border-border p-4 font-mono-data">
              <div className="flex items-center gap-2 border-b border-border pb-2 mb-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-xs text-foreground uppercase">7. QUANTO (Custo)</h3>
              </div>
              <p className="text-base font-bold text-primary">
                {formatCurrency(task.howMuch, workspaceConfig.currencySymbol)}
              </p>
              <span className="text-[10px] text-muted-foreground uppercase">Orçamento aprovado</span>
            </div>
          </div>

          {/* Observations & Progress Bar */}
          <div className="bg-card p-4 border border-border space-y-3 font-mono-data">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-bold">Status Atual: {task.status}</span>
              <span className="text-primary font-bold">{task.progressPercent}% Concluído</span>
            </div>
            <div className="w-full bg-muted h-2 border border-border">
              <div className="bg-primary h-full" style={{ width: `${task.progressPercent}%` }}></div>
            </div>

            {task.observations && (
              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                <span className="text-muted-foreground font-bold uppercase block mb-1">Observações:</span>
                <p>{task.observations}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
