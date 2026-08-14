'use client';

import React, { useState } from 'react';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Wrench,
  Brain,
  DollarSign,
  Calendar,
  User,
  MapPin,
} from 'lucide-react';

interface AiGeneratorViewProps {
  workspaceConfig: WorkspaceConfig;
  addTask: (newTask: Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AiGeneratorView: React.FC<AiGeneratorViewProps> = ({
  workspaceConfig,
  addTask,
  showToast,
}) => {
  const [promptText, setPromptText] = useState('');
  const [selectedDept, setSelectedDept] = useState(workspaceConfig.departmentName || 'Geral');
  const [isLoading, setIsLoading] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<Partial<Task5W2H>[]>([]);
  const [addedIndexes, setAddedIndexes] = useState<number[]>([]);

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      showToast('info', 'Descrição em branco', 'Descreva o problema ou meta corporativa para a IA.');
      return;
    }

    setIsLoading(true);
    setAiDrafts([]);
    setAddedIndexes([]);

    try {
      const res = await fetch('/api/gemini/5w2h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          department: selectedDept,
          availableDepartments: workspaceConfig.departments,
          availableCategories: workspaceConfig.categoriesByDepartment[selectedDept] || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao comunicar com a IA Gemini');
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        setAiDrafts(data.tasks);
        showToast(
          'success',
          'Plano 5W2H Gerado!',
          `A IA criou ${data.tasks.length} rascunhos de plano de ação 5W2H.`
        );
      } else {
        showToast('error', 'Resposta Inválida', 'A IA não retornou um plano estruturado.');
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      showToast('error', 'Erro na IA', err.message || 'Ocorreu um erro ao gerar o plano 5W2H.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertDraftToTask = (draft: Partial<Task5W2H>, index: number) => {
    if (addedIndexes.includes(index)) return;

    const todayStr = new Date().toISOString().slice(0, 10);
    const deadlineDefault = new Date();
    deadlineDefault.setDate(deadlineDefault.getDate() + 30);
    const deadlineStr = deadlineDefault.toISOString().slice(0, 10);

    const newTask: Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'> = {
      title: draft.title || 'Nova Ação 5W2H',
      why: draft.why || 'Melhoria de processo',
      where: draft.where || selectedDept,
      startDate: draft.startDate || todayStr,
      deadlineDate: draft.deadlineDate || deadlineStr,
      who: draft.who || 'Responsável Definido',
      how: draft.how || 'Ações operacionais',
      howMuch: Number(draft.howMuch) || 0,
      department: draft.department || selectedDept,
      category: draft.category || 'Geral',
      competence: draft.competence || `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`,
      priority: (draft.priority as any) || 'Média',
      status: 'Não iniciado',
      progressPercent: 0,
      observations: draft.observations || 'Gerado via Inteligência Artificial Gemini',
    };

    addTask(newTask);
    setAddedIndexes((prev) => [...prev, index]);
  };

  const handleAddAll = () => {
    aiDrafts.forEach((draft, idx) => {
      if (!addedIndexes.includes(idx)) {
        handleConvertDraftToTask(draft, idx);
      }
    });
  };

  return (
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col space-y-4 overflow-y-auto w-full bg-background">
      {/* Header Banner */}
      <div className="bg-info/10 border border-info/40 p-4 md:p-5 relative w-full shrink-0">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 bg-info/20 border border-info/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-info" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-info uppercase tracking-wide font-mono-data">
              Gerador Inteligente 5W2H com Gemini AI
            </h2>
            <p className="text-[11px] text-muted-foreground font-body-md mt-0.5 leading-relaxed">
              Descreva em linguagem natural o problema corporativo, desafio ou meta desejada. A IA
              irá estruturar automaticamente todos os 7 pilares 5W2H (O quê, Por quê, Onde, Quando, Quem, Como e Quanto)
              prontos para conversão em tarefas no seu workspace.
            </p>
          </div>
        </div>
      </div>

      {/* Input Box */}
      <div className="bg-card border border-border p-4 md:p-5 space-y-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
              Departamento de Destino:
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-background border border-input text-foreground text-xs font-mono-data p-2 focus:border-primary focus:outline-none cursor-pointer"
            >
              {workspaceConfig.departments.map((d) => (
                <option key={d} value={d} className="bg-popover text-foreground">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
              Exemplos Rápidos de Prompts:
            </label>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() =>
                  setPromptText(
                    'Precisamos implantar um sistema de controle de estoque no almoxarifado para evitar perdas de materiais e otimizar compras.'
                  )
                }
                className="text-[10px] bg-background border border-border px-2 py-1 text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer transition-colors"
              >
                Controle de Estoque
              </button>
              <button
                type="button"
                onClick={() =>
                  setPromptText(
                    'Implementar processo de admissão e onboarding 100% digital para novos colaboradores com integração no eSocial.'
                  )
                }
                className="text-[10px] bg-background border border-border px-2 py-1 text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer transition-colors"
              >
                Onboarding Digital
              </button>
              <button
                type="button"
                onClick={() =>
                  setPromptText(
                    'Reduzir a taxa de inadimplência de clientes em 20% realizando cobrança preventiva e renegociação de dívidas.'
                  )
                }
                className="text-[10px] bg-background border border-border px-2 py-1 text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer transition-colors"
              >
                Cobrança Preventiva
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
            Descrição do Objetivo / Problema:
          </label>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Ex.: Precisamos organizar a rotina de treinamento da equipe de vendas em novos produtos para aumentar a taxa de conversão em 15%..."
            rows={4}
            className="w-full bg-background border border-input text-foreground text-xs p-3 focus:border-primary focus:outline-none font-body-md"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !promptText.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-info/90 hover:bg-info text-info-foreground disabled:opacity-50 font-bold text-xs uppercase tracking-wider font-mono-data transition-colors cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analisando e Estruturando Matriz 5W2H com IA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Gerar Rascunhos 5W2H</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Results Section */}
      {aiDrafts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="text-sm font-bold text-foreground font-mono-data uppercase">
              Rascunhos 5W2H Gerados ({aiDrafts.length})
            </h3>
            {aiDrafts.length > 1 && (
              <button
                onClick={handleAddAll}
                className="px-3 py-1 bg-primary text-primary-foreground font-bold text-xs font-mono-data uppercase hover:bg-primary/90 cursor-pointer"
              >
                Adicionar Todos ao Plano ({aiDrafts.length})
              </button>
            )}
          </div>

          <div className="space-y-4">
            {aiDrafts.map((draft, idx) => {
              const isAdded = addedIndexes.includes(idx);
              return (
                <div
                  key={idx}
                  className={`bg-card border ${
                    isAdded ? 'border-primary' : 'border-border'
                  } p-5 space-y-4 relative transition-colors`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-border pb-3">
                    <div>
                      <span className="text-[10px] font-mono-data text-muted-foreground uppercase block">
                        Ação Sugerida #{idx + 1} • {draft.department || selectedDept}
                      </span>
                      <h4 className="text-base font-bold text-foreground">{draft.title}</h4>
                    </div>
                    <button
                      onClick={() => handleConvertDraftToTask(draft, idx)}
                      disabled={isAdded}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-data uppercase font-bold tracking-wider transition-colors shrink-0 cursor-pointer ${
                        isAdded
                          ? 'bg-card border border-primary text-primary cursor-default'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Adicionado ao Workspace</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Converter em Tarefa (1-Clique)</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 5W2H Matrix Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-background p-3 border border-border">
                      <span className="text-[10px] font-mono-data text-info uppercase block font-bold mb-1">
                        Por quê (Justificativa)
                      </span>
                      <p className="text-muted-foreground">{draft.why}</p>
                    </div>

                    <div className="bg-background p-3 border border-border">
                      <span className="text-[10px] font-mono-data text-foreground uppercase block font-bold mb-1">
                        Como (Metodologia)
                      </span>
                      <p className="text-muted-foreground whitespace-pre-line">{draft.how}</p>
                    </div>

                    <div className="bg-background p-2.5 border border-border grid grid-cols-2 gap-2 text-[11px] font-mono-data">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Onde</span>
                        <span className="text-foreground">{draft.where}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Quem</span>
                        <span className="text-foreground font-bold">{draft.who}</span>
                      </div>
                    </div>

                    <div className="bg-background p-2.5 border border-border grid grid-cols-2 gap-2 text-[11px] font-mono-data">
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Quando (Prazo)</span>
                        <span className="text-foreground">{draft.deadlineDate}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground block uppercase">Quanto</span>
                        <span className="text-primary font-bold">
                          {workspaceConfig.currencySymbol} {draft.howMuch || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {draft.observations && (
                    <div className="text-[11px] text-muted-foreground font-mono-data bg-background p-2 border border-border">
                      <span className="text-muted-foreground font-bold uppercase mr-1">Observação IA:</span>
                      {draft.observations}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
