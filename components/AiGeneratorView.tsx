'use client';

import React, { useState } from 'react';
import { Task5W2H, WorkspaceConfig, TaskPriority } from '@/types/5w2h';
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
  Tag,
  Flag,
  Layers,
  Edit3,
  Trash2,
  RotateCcw,
  FileText,
  Info,
} from 'lucide-react';

interface AiGeneratorViewProps {
  workspaceConfig: WorkspaceConfig;
  addTask: (newTask: Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addMultipleTasks?: (newTasks: Array<Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AiGeneratorView: React.FC<AiGeneratorViewProps> = ({
  workspaceConfig,
  addTask,
  addMultipleTasks,
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

      let data: any = null;
      const contentType = res.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        try {
          data = await res.json();
        } catch {
          data = null;
        }
      } else {
        const textOutput = await res.text();
        console.warn('Non-JSON response from /api/gemini/5w2h:', textOutput);
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            `Erro no servidor (${res.status}). Verifique a conexão ou a chave de API nas configurações.`
        );
      }

      if (data?.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const deadlineDefault = new Date();
        deadlineDefault.setDate(deadlineDefault.getDate() + 30);
        const deadlineStr = deadlineDefault.toISOString().slice(0, 10);
        const competenceStr = `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`;

        const normalizedTasks: Partial<Task5W2H>[] = data.tasks.map((t: any) => ({
          ...t,
          title: t.title || 'Nova Ação 5W2H',
          why: t.why || 'Melhoria de processo',
          where: t.where || selectedDept,
          startDate: t.startDate || todayStr,
          deadlineDate: t.deadlineDate || deadlineStr,
          who: t.who || 'Responsável Definido',
          how: t.how || 'Ações operacionais',
          howMuch: typeof t.howMuch === 'number' ? t.howMuch : (Number(t.howMuch) || 0),
          department: t.department || selectedDept,
          category: t.category || (workspaceConfig.categoriesByDepartment[t.department || selectedDept]?.[0] || 'Geral'),
          competence: t.competence || competenceStr,
          priority: (t.priority as TaskPriority) || 'Média',
          observations: t.observations || 'Gerado via Inteligência Artificial Gemini',
        }));

        setAiDrafts(normalizedTasks);
        showToast(
          data.notice ? 'info' : 'success',
          data.notice ? 'Plano 5W2H Estruturado' : 'Plano 5W2H Gerado!',
          data.notice || `A IA criou ${data.tasks.length} rascunhos de plano de ação 5W2H editáveis.`
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

  const handleUpdateDraft = (index: number, field: keyof Task5W2H, value: any) => {
    setAiDrafts((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleRemoveDraft = (index: number) => {
    setAiDrafts((prev) => prev.filter((_, idx) => idx !== index));
    setAddedIndexes((prev) =>
      prev
        .filter((idx) => idx !== index)
        .map((idx) => (idx > index ? idx - 1 : idx))
    );
  };

  const buildTaskFromDraft = (draft: Partial<Task5W2H>): Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'> => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const deadlineDefault = new Date();
    deadlineDefault.setDate(deadlineDefault.getDate() + 30);
    const deadlineStr = deadlineDefault.toISOString().slice(0, 10);

    return {
      title: draft.title?.trim() || 'Nova Ação 5W2H',
      why: draft.why?.trim() || 'Melhoria de processo',
      where: draft.where?.trim() || selectedDept,
      startDate: draft.startDate || todayStr,
      deadlineDate: draft.deadlineDate || deadlineStr,
      who: draft.who?.trim() || 'Responsável Definido',
      how: draft.how?.trim() || 'Ações operacionais',
      howMuch: Number(draft.howMuch) || 0,
      department: draft.department || selectedDept,
      category: draft.category || 'Geral',
      competence: draft.competence || `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`,
      priority: (draft.priority as TaskPriority) || 'Média',
      status: 'Não iniciado',
      progressPercent: 0,
      observations: draft.observations?.trim() || 'Gerado via Inteligência Artificial Gemini',
    };
  };

  const handleConvertDraftToTask = (draft: Partial<Task5W2H>, index: number) => {
    if (addedIndexes.includes(index)) return;

    const newTask = buildTaskFromDraft(draft);
    addTask(newTask);
    setAddedIndexes((prev) => [...prev, index]);
    showToast('success', 'Ação Adicionada', `"${newTask.title}" foi convertida em tarefa.`);
  };

  const handleAddAll = () => {
    const pendingIndexes: number[] = [];
    const pendingTasks: Array<Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>> = [];

    aiDrafts.forEach((draft, idx) => {
      if (!addedIndexes.includes(idx)) {
        pendingIndexes.push(idx);
        pendingTasks.push(buildTaskFromDraft(draft));
      }
    });

    if (pendingTasks.length === 0) return;

    if (addMultipleTasks) {
      addMultipleTasks(pendingTasks);
    } else {
      pendingTasks.forEach((t) => addTask(t));
    }

    setAddedIndexes((prev) => [...prev, ...pendingIndexes]);
    showToast('success', 'Ações Adicionadas', `${pendingTasks.length} tarefas foram criadas com sucesso.`);
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
              irá estruturar automaticamente todos os 7 pilares 5W2H (O quê, Por quê, Onde, Quando, Quem, Como e Quanto).
              Todos os campos gerados são <strong className="text-foreground">100% editáveis</strong> antes de salvar no seu workspace.
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-2">
            <div>
              <h3 className="text-sm font-bold text-foreground font-mono-data uppercase flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                Rascunhos 5W2H Gerados ({aiDrafts.length})
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Revise, complemente ou edite os textos diretamente abaixo antes de adicionar às tarefas.
              </p>
            </div>
            {aiDrafts.length > 1 && (
              <button
                onClick={handleAddAll}
                className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs font-mono-data uppercase hover:bg-primary/90 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Todos ao Plano ({aiDrafts.length - addedIndexes.length})
              </button>
            )}
          </div>

          <div className="space-y-5">
            {aiDrafts.map((draft, idx) => {
              const isAdded = addedIndexes.includes(idx);
              const availableCategories = workspaceConfig.categoriesByDepartment[draft.department || selectedDept] || [];

              return (
                <div
                  key={idx}
                  className={`bg-card border ${
                    isAdded ? 'border-primary/80 bg-card/60' : 'border-border'
                  } p-4 md:p-5 space-y-4 relative transition-colors shadow-sm`}
                >
                  {/* Top Bar with Number, Status and Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-muted text-foreground text-[10px] font-mono-data font-bold uppercase border border-border">
                        Ação #{idx + 1}
                      </span>
                      {isAdded && (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-mono-data font-bold uppercase border border-primary/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Adicionado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveDraft(idx)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors border border-transparent hover:border-border cursor-pointer"
                        title="Remover este rascunho"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
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
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Adicionado ao Workspace</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Converter em Tarefa</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 1. O QUÊ (What / Title) - Full Width Editable Input */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono-data text-primary font-bold uppercase flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      1. O QUÊ (Título da Ação / Objetivo)
                    </label>
                    <input
                      type="text"
                      value={draft.title || ''}
                      onChange={(e) => handleUpdateDraft(idx, 'title', e.target.value)}
                      placeholder="Descreva o que será feito..."
                      className="w-full bg-background border border-input text-foreground text-xs font-bold p-2.5 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* 2. POR QUÊ & COMO (Why & How) - 2 Columns Textareas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono-data text-info font-bold uppercase flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        2. POR QUÊ (Justificativa & Impacto)
                      </label>
                      <textarea
                        value={draft.why || ''}
                        onChange={(e) => handleUpdateDraft(idx, 'why', e.target.value)}
                        placeholder="Por que esta ação é necessária..."
                        rows={3}
                        className="w-full bg-background border border-input text-foreground text-xs p-2.5 focus:border-info focus:outline-none leading-relaxed"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono-data text-foreground font-bold uppercase flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" />
                        3. COMO (Metodologia & Etapas Operacionais)
                      </label>
                      <textarea
                        value={draft.how || ''}
                        onChange={(e) => handleUpdateDraft(idx, 'how', e.target.value)}
                        placeholder="Como será executado (passo a passo)..."
                        rows={3}
                        className="w-full bg-background border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none leading-relaxed font-mono-data"
                      />
                    </div>
                  </div>

                  {/* 3. ONDE, QUEM, QUANDO, QUANTO (Where, Who, When, How Much) - 4 Columns Responsive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono-data text-muted-foreground font-bold uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        4. ONDE (Local / Setor)
                      </label>
                      <input
                        type="text"
                        value={draft.where || ''}
                        onChange={(e) => handleUpdateDraft(idx, 'where', e.target.value)}
                        placeholder="Ex: Almoxarifado / Filial"
                        className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono-data text-muted-foreground font-bold uppercase flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        5. QUEM (Responsável)
                      </label>
                      <input
                        type="text"
                        value={draft.who || ''}
                        onChange={(e) => handleUpdateDraft(idx, 'who', e.target.value)}
                        placeholder="Nome do responsável..."
                        className="w-full bg-background border border-input text-foreground text-xs font-semibold p-2 focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono-data text-muted-foreground font-bold uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        6. QUANDO (Prazo Limite)
                      </label>
                      <input
                        type="date"
                        value={draft.deadlineDate || ''}
                        onChange={(e) => handleUpdateDraft(idx, 'deadlineDate', e.target.value)}
                        className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono-data text-muted-foreground font-bold uppercase flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-primary" />
                        7. QUANTO (Custo em {workspaceConfig.currencySymbol})
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={draft.howMuch ?? 0}
                        onChange={(e) => handleUpdateDraft(idx, 'howMuch', Number(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full bg-background border border-input text-foreground text-xs font-bold p-2 focus:border-primary focus:outline-none font-mono-data"
                      />
                    </div>
                  </div>

                  {/* 4. Categorização & Metadados (Departamento, Categoria, Prioridade, Observação) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/60 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono-data text-muted-foreground font-bold uppercase flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        Departamento
                      </label>
                      <select
                        value={draft.department || selectedDept}
                        onChange={(e) => {
                          const newDept = e.target.value;
                          handleUpdateDraft(idx, 'department', newDept);
                          // Update category to first available if previous category is invalid
                          const deptsCats = workspaceConfig.categoriesByDepartment[newDept] || [];
                          if (deptsCats.length > 0 && (!draft.category || !deptsCats.includes(draft.category))) {
                            handleUpdateDraft(idx, 'category', deptsCats[0]);
                          }
                        }}
                        className="w-full bg-background border border-input text-foreground text-xs font-mono-data p-2 focus:border-primary focus:outline-none cursor-pointer"
                      >
                        {workspaceConfig.departments.map((d) => (
                          <option key={d} value={d} className="bg-popover text-foreground">
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono-data text-muted-foreground font-bold uppercase flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Categoria
                      </label>
                      <select
                        value={draft.category || availableCategories[0] || 'Geral'}
                        onChange={(e) => handleUpdateDraft(idx, 'category', e.target.value)}
                        className="w-full bg-background border border-input text-foreground text-xs font-mono-data p-2 focus:border-primary focus:outline-none cursor-pointer"
                      >
                        {availableCategories.length > 0 ? (
                          availableCategories.map((c) => (
                            <option key={c} value={c} className="bg-popover text-foreground">
                              {c}
                            </option>
                          ))
                        ) : (
                          <option value="Geral" className="bg-popover text-foreground">
                            Geral
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono-data text-muted-foreground font-bold uppercase flex items-center gap-1">
                        <Flag className="w-3 h-3" />
                        Prioridade
                      </label>
                      <select
                        value={draft.priority || 'Média'}
                        onChange={(e) => handleUpdateDraft(idx, 'priority', e.target.value as TaskPriority)}
                        className="w-full bg-background border border-input text-foreground text-xs font-mono-data p-2 focus:border-primary focus:outline-none cursor-pointer"
                      >
                        <option value="Baixa" className="bg-popover text-foreground">Baixa</option>
                        <option value="Média" className="bg-popover text-foreground">Média</option>
                        <option value="Alta" className="bg-popover text-foreground">Alta</option>
                        <option value="Urgente" className="bg-popover text-foreground">Urgente</option>
                      </select>
                    </div>
                  </div>

                  {/* 5. Observações Adicionais */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono-data text-muted-foreground font-bold uppercase flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Observações / Anotações Complementares
                    </label>
                    <input
                      type="text"
                      value={draft.observations || ''}
                      onChange={(e) => handleUpdateDraft(idx, 'observations', e.target.value)}
                      placeholder="Observações complementares..."
                      className="w-full bg-background border border-input text-muted-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

