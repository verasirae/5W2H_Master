'use client';

import React, { useState } from 'react';
import { Task5W2H, WorkspaceConfig, TaskPriority } from '@/types/5w2h';
import { formatCurrency, formatShortDate } from '@/lib/5w2h-utils';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
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
  FileText,
  Info,
  Copy,
  Printer,
  Download,
  BarChart3,
  RefreshCw,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface AiGeneratorViewProps {
  workspaceConfig: WorkspaceConfig;
  addTask: (newTask: Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addMultipleTasks?: (newTasks: Array<Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  activeTasks?: Task5W2H[];
}

export const AiGeneratorView: React.FC<AiGeneratorViewProps> = ({
  workspaceConfig,
  addTask,
  addMultipleTasks,
  showToast,
  activeTasks = [],
}) => {
  const [activeTab, setActiveTab] = useState<'generator' | 'report'>('generator');

  // Generator State
  const [promptText, setPromptText] = useState('');
  const [selectedDept, setSelectedDept] = useState(workspaceConfig.departmentName || 'Geral');
  const [isLoading, setIsLoading] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<Partial<Task5W2H>[]>([]);
  const [addedIndexes, setAddedIndexes] = useState<number[]>([]);

  // Report State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [executiveReport, setExecutiveReport] = useState<string | null>(null);

  // Filter tasks to only include active tasks (non-archived)
  const currentActiveTasks = activeTasks.filter((t) => t.status !== 'Arquivado');

  // ----------------------------------------------------
  // GENERATOR HANDLERS
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // EXECUTIVE REPORT HANDLERS
  // ----------------------------------------------------
  const handleGenerateReport = async () => {
    if (currentActiveTasks.length === 0) {
      showToast('info', 'Sem Tarefas Ativas', 'Crie tarefas ativas no seu workspace antes de gerar um relatório.');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const payloadTasks = currentActiveTasks.map((t) => ({
        id: t.id,
        title: t.title,
        department: t.department,
        category: t.category,
        status: t.status,
        priority: t.priority,
        deadlineDate: t.deadlineDate,
        who: t.who,
        howMuch: t.howMuch,
        progressPercent: t.progressPercent,
      }));

      const res = await fetch('/api/gemini/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: payloadTasks,
          workspaceName: workspaceConfig.workspaceName || '5W2H Master',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar relatório com IA.');
      }

      setExecutiveReport(data.report);
      showToast('success', 'Relatório Gerado!', 'Diagnóstico executivo gerado com sucesso pela IA Gemini.');
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      showToast('error', 'Falha no Relatório', err.message || 'Não foi possível gerar o relatório.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (!executiveReport) return;
    navigator.clipboard.writeText(executiveReport);
    showToast('success', 'Copiado!', 'Relatório executivo copiado para a área de transferência.');
  };

  const handleExportReportPdf = () => {
    if (!executiveReport) return;
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const primaryColor: [number, number, number] = [14, 116, 144];
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 20, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('DIAGNÓSTICO EXECUTIVO 5W2H - GEMINI AI', 14, 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')} • Workspace: ${workspaceConfig.workspaceName || '5W2H Master'}`, 14, 17);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(9);

      // Clean markdown tags for basic PDF printing
      const plainText = executiveReport
        .replace(/#{1,6}\s?/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/---/g, '---------------------------------------------------');

      const splitText = doc.splitTextToSize(plainText, 182);
      let cursorY = 28;

      for (let i = 0; i < splitText.length; i++) {
        if (cursorY > 280) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(splitText[i], 14, cursorY);
        cursorY += 5;
      }

      doc.save(`Relatorio_Executivo_5W2H_${new Date().toISOString().slice(0, 10)}.pdf`);
      showToast('success', 'PDF Baixado!', 'Relatório executivo exportado em PDF com sucesso.');
    } catch (err: any) {
      console.error('Erro ao exportar PDF do relatório:', err);
      showToast('error', 'Erro', 'Não foi possível baixar o PDF do relatório.');
    }
  };

  // Metrics for the Report Tab
  const totalCost = currentActiveTasks.reduce((acc, t) => acc + (Number(t.howMuch) || 0), 0);
  const delayedTasks = currentActiveTasks.filter((t) => t.status === 'Atrasado');
  const inProgressTasks = currentActiveTasks.filter((t) => t.status === 'Em andamento');

  return (
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col space-y-4 overflow-y-auto w-full bg-background">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono-data uppercase font-bold transition-colors cursor-pointer rounded-t-md ${
            activeTab === 'generator'
              ? 'bg-primary text-primary-foreground border-b-2 border-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Gerador Inteligente 5W2H</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-mono-data uppercase font-bold transition-colors cursor-pointer rounded-t-md ${
            activeTab === 'report'
              ? 'bg-primary text-primary-foreground border-b-2 border-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Relatório Executivo com IA</span>
          {currentActiveTasks.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-background/20 text-inherit font-mono-data">
              {currentActiveTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SMART 5W2H GENERATOR                                               */}
      {/* ========================================================================= */}
      {activeTab === 'generator' && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-info/10 border border-info/40 p-4 md:p-5 relative w-full shrink-0 rounded-md">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 bg-info/20 border border-info/40 flex items-center justify-center shrink-0 rounded-md">
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
          <div className="bg-card border border-border p-4 md:p-5 space-y-4 w-full rounded-md shadow-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                  Departamento de Destino:
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-background border border-input text-foreground text-xs font-mono-data p-2 focus:border-primary focus:outline-none cursor-pointer rounded-md"
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
                    className="text-[10px] bg-background border border-border px-2 py-1 text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer transition-colors rounded-md"
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
                    className="text-[10px] bg-background border border-border px-2 py-1 text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer transition-colors rounded-md"
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
                    className="text-[10px] bg-background border border-border px-2 py-1 text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer transition-colors rounded-md"
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
                className="w-full bg-background border border-input text-foreground text-xs p-3 focus:border-primary focus:outline-none font-body-md rounded-md"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading || !promptText.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-info/90 hover:bg-info text-info-foreground disabled:opacity-50 font-bold text-xs uppercase tracking-wider font-mono-data transition-colors cursor-pointer rounded-md"
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
                    className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs font-mono-data uppercase hover:bg-primary/90 cursor-pointer flex items-center gap-1.5 rounded-md"
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
                      } p-4 md:p-5 space-y-4 relative transition-colors shadow-sm rounded-md`}
                    >
                      {/* Top Bar with Number, Status and Action Buttons */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-muted text-foreground text-[10px] font-mono-data font-bold uppercase border border-border rounded-md">
                            Ação #{idx + 1}
                          </span>
                          {isAdded && (
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-mono-data font-bold uppercase border border-primary/40 flex items-center gap-1 rounded-md">
                              <CheckCircle2 className="w-3 h-3" />
                              Adicionado
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveDraft(idx)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors border border-transparent hover:border-border cursor-pointer rounded-md"
                            title="Remover este rascunho"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleConvertDraftToTask(draft, idx)}
                            disabled={isAdded}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono-data uppercase font-bold tracking-wider transition-colors shrink-0 cursor-pointer rounded-md ${
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
                          className="w-full bg-background border border-input text-foreground text-xs font-bold p-2.5 focus:border-primary focus:outline-none rounded-md"
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
                            className="w-full bg-background border border-input text-foreground text-xs p-2.5 focus:border-info focus:outline-none leading-relaxed rounded-md"
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
                            className="w-full bg-background border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none leading-relaxed font-mono-data rounded-md"
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
                            className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none rounded-md"
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
                            className="w-full bg-background border border-input text-foreground text-xs font-semibold p-2 focus:border-primary focus:outline-none rounded-md"
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
                            className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data rounded-md"
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
                            className="w-full bg-background border border-input text-foreground text-xs font-bold p-2 focus:border-primary focus:outline-none font-mono-data rounded-md"
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
                              const deptsCats = workspaceConfig.categoriesByDepartment[newDept] || [];
                              if (deptsCats.length > 0 && (!draft.category || !deptsCats.includes(draft.category))) {
                                handleUpdateDraft(idx, 'category', deptsCats[0]);
                              }
                            }}
                            className="w-full bg-background border border-input text-foreground text-xs font-mono-data p-2 focus:border-primary focus:outline-none cursor-pointer rounded-md"
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
                            className="w-full bg-background border border-input text-foreground text-xs font-mono-data p-2 focus:border-primary focus:outline-none cursor-pointer rounded-md"
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
                            className="w-full bg-background border border-input text-foreground text-xs font-mono-data p-2 focus:border-primary focus:outline-none cursor-pointer rounded-md"
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
                          className="w-full bg-background border border-input text-muted-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data rounded-md"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AI EXECUTIVE REPORT & DIAGNOSIS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-card border border-border p-4 md:p-5 rounded-md shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center rounded-md shrink-0">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground font-mono-data uppercase">
                    Diagnóstico Executivo 5W2H com IA
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Gere uma análise estratégica consolidada das {currentActiveTasks.length} tarefas ativas do seu workspace.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport || currentActiveTasks.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs font-mono-data uppercase hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer rounded-md shrink-0 shadow-xs"
              >
                {isGeneratingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando Diagnóstico...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{executiveReport ? 'Atualizar Diagnóstico' : 'Gerar Relatório com IA'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Metrics Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border font-mono-data text-xs">
              <div className="bg-background border border-border p-2.5 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase block">Tarefas Ativas</span>
                <span className="text-base font-bold text-foreground">{currentActiveTasks.length}</span>
              </div>
              <div className="bg-background border border-border p-2.5 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase block">Em Andamento</span>
                <span className="text-base font-bold text-info">{inProgressTasks.length}</span>
              </div>
              <div className="bg-background border border-border p-2.5 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase block">Atrasadas / Críticas</span>
                <span className={`text-base font-bold ${delayedTasks.length > 0 ? 'text-destructive' : 'text-primary'}`}>
                  {delayedTasks.length}
                </span>
              </div>
              <div className="bg-background border border-border p-2.5 rounded-md">
                <span className="text-[10px] text-muted-foreground uppercase block">Orçamento Alocado</span>
                <span className="text-base font-bold text-primary">
                  {formatCurrency(totalCost, workspaceConfig.currencySymbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Report Viewer Box */}
          {executiveReport ? (
            <div className="bg-card border border-border p-5 rounded-md shadow-sm space-y-4">
              {/* Report Actions Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border pb-3">
                <span className="text-xs font-bold text-primary uppercase font-mono-data flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  Relatório Executivo Consolidado
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyReport}
                    className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border hover:border-info text-info text-xs font-mono-data uppercase transition-colors cursor-pointer rounded-md"
                    title="Copiar texto do relatório"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportReportPdf}
                    className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border hover:border-primary text-primary text-xs font-mono-data uppercase transition-colors cursor-pointer rounded-md"
                    title="Baixar Relatório em PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border hover:border-foreground text-muted-foreground hover:text-foreground text-xs font-mono-data uppercase transition-colors cursor-pointer rounded-md"
                    title="Imprimir Relatório"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>

              {/* Rendered Markdown Body */}
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed font-body-md bg-background p-4 border border-border rounded-md">
                <ReactMarkdown>{executiveReport}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border p-12 text-center rounded-md space-y-3">
              <Sparkles className="w-10 h-10 text-primary/40 mx-auto" />
              <h3 className="text-sm font-bold text-foreground uppercase font-mono-data">
                Nenhum relatório gerado ainda
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Clique no botão <strong>&quot;Gerar Relatório com IA&quot;</strong> acima para que a inteligência artificial analise suas {currentActiveTasks.length} tarefas ativas, identifique gargalos e trace recomendações para a sua equipe.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
