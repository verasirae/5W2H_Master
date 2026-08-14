'use client';

import React, { useState, useEffect } from 'react';
import { Task5W2H, WorkspaceConfig, TaskPriority, TaskStatus } from '@/types/5w2h';
import { X, Save, AlertCircle } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: Task5W2H | null;
  workspaceConfig: WorkspaceConfig;
  onSave: (taskData: Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updatedData: Partial<Task5W2H>) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  editingTask,
  workspaceConfig,
  onSave,
  onUpdate,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentCompDefault = `${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getFullYear()}`;

  const [formData, setFormData] = useState({
    title: '',
    why: '',
    where: '',
    startDate: todayStr,
    deadlineDate: todayStr,
    who: '',
    how: '',
    howMuch: 0,
    department: workspaceConfig.departments[0] || 'RH/DP',
    category: 'Geral',
    competence: currentCompDefault,
    priority: 'Média' as TaskPriority,
    status: 'Não iniciado' as TaskStatus,
    progressPercent: 0,
    completionDate: '',
    observations: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [prevOpen, setPrevOpen] = useState(false);
  const [prevEditingTask, setPrevEditingTask] = useState<Task5W2H | null>(null);

  if (isOpen !== prevOpen || editingTask !== prevEditingTask) {
    setPrevOpen(isOpen);
    setPrevEditingTask(editingTask);
    if (isOpen) {
      if (editingTask) {
        setFormData({
          title: editingTask.title || '',
          why: editingTask.why || '',
          where: editingTask.where || '',
          startDate: editingTask.startDate || todayStr,
          deadlineDate: editingTask.deadlineDate || todayStr,
          who: editingTask.who || '',
          how: editingTask.how || '',
          howMuch: editingTask.howMuch || 0,
          department: editingTask.department || workspaceConfig.departments[0] || 'RH/DP',
          category: editingTask.category || 'Geral',
          competence: editingTask.competence || currentCompDefault,
          priority: editingTask.priority || 'Média',
          status: editingTask.status || 'Não iniciado',
          progressPercent: editingTask.progressPercent || 0,
          completionDate: editingTask.completionDate || '',
          observations: editingTask.observations || '',
        });
      } else {
        setFormData({
          title: '',
          why: '',
          where: workspaceConfig.departmentName || 'Sede Administrativa',
          startDate: todayStr,
          deadlineDate: todayStr,
          who: '',
          how: '',
          howMuch: 0,
          department: workspaceConfig.departments[0] || 'RH/DP',
          category: (workspaceConfig.categoriesByDepartment[workspaceConfig.departments[0]] || [])[0] || 'Geral',
          competence: currentCompDefault,
          priority: 'Média',
          status: 'Não iniciado',
          progressPercent: 0,
          completionDate: '',
          observations: '',
        });
      }
      setErrors({});
    }
  }

  if (!isOpen) return null;

  const currentCategories =
    workspaceConfig.categoriesByDepartment[formData.department] || ['Geral', 'Processos Internos'];

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = 'O campo "O quê" (Título) é obrigatório.';
    if (!formData.why.trim()) errs.why = 'O campo "Por quê" (Justificativa) é obrigatório.';
    if (!formData.where.trim()) errs.where = 'O campo "Onde" é obrigatório.';
    if (!formData.deadlineDate) errs.deadlineDate = 'A data de prazo (Quando) é obrigatória.';
    if (!formData.who.trim()) errs.who = 'O campo "Quem" (Responsável) é obrigatório.';
    if (!formData.how.trim()) errs.how = 'O campo "Como" (Método) é obrigatório.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (editingTask) {
      onUpdate(editingTask.id, formData);
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="bg-card border border-border w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border bg-card shrink-0">
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground uppercase tracking-wide font-mono-data">
              {editingTask ? `Editar Ação 5W2H - ${editingTask.id}` : 'Cadastrar Nova Ação 5W2H'}
            </h2>
            <p className="text-xs text-muted-foreground">Preencha as variáveis da matriz 5W2H.</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-destructive transition-colors p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 bg-background">
          {/* Section 1: Department & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card p-4 border border-border">
            <div>
              <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                Departamento *
              </label>
              <select
                value={formData.department}
                onChange={(e) => {
                  const newDept = e.target.value;
                  const cats = workspaceConfig.categoriesByDepartment[newDept] || ['Geral'];
                  setFormData((prev) => ({
                    ...prev,
                    department: newDept,
                    category: cats[0] || 'Geral',
                  }));
                }}
                className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none cursor-pointer"
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
                Categoria / Rotina *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none cursor-pointer"
              >
                {currentCategories.map((c) => (
                  <option key={c} value={c} className="bg-popover text-foreground">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                Competência (MM/YYYY) *
              </label>
              <input
                type="text"
                value={formData.competence}
                onChange={(e) => setFormData((prev) => ({ ...prev, competence: e.target.value }))}
                placeholder="08/2026"
                className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
              />
            </div>
          </div>

          {/* 5W2H Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* O QUÊ */}
            <div className="md:col-span-2 space-y-1">
              <label className="text-[11px] font-mono-data text-primary font-bold uppercase block">
                1. O QUÊ (Título da Ação) *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Descreva o objetivo principal..."
                className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-body-md"
              />
              {errors.title && <p className="text-[10px] text-destructive font-mono-data">{errors.title}</p>}
            </div>

            {/* POR QUÊ */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono-data text-info font-bold uppercase block">
                2. POR QUÊ (Justificativa) *
              </label>
              <textarea
                value={formData.why}
                onChange={(e) => setFormData((prev) => ({ ...prev, why: e.target.value }))}
                placeholder="Motivação e impacto esperado..."
                rows={3}
                className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-body-md"
              />
              {errors.why && <p className="text-[10px] text-destructive font-mono-data">{errors.why}</p>}
            </div>

            {/* COMO */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono-data text-foreground font-bold uppercase block">
                3. COMO (Metodologia) *
              </label>
              <textarea
                value={formData.how}
                onChange={(e) => setFormData((prev) => ({ ...prev, how: e.target.value }))}
                placeholder="Etapas do processo e procedimentos..."
                rows={3}
                className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-body-md"
              />
              {errors.how && <p className="text-[10px] text-destructive font-mono-data">{errors.how}</p>}
            </div>

            {/* QUEM */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono-data text-muted-foreground font-bold uppercase block">
                4. QUEM (Responsável) *
              </label>
              <input
                type="text"
                value={formData.who}
                onChange={(e) => setFormData((prev) => ({ ...prev, who: e.target.value }))}
                placeholder="Nome do responsável ou cargo..."
                className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-body-md"
              />
              {errors.who && <p className="text-[10px] text-destructive font-mono-data">{errors.who}</p>}
            </div>

            {/* ONDE */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono-data text-muted-foreground font-bold uppercase block">
                5. ONDE (Setor / Local) *
              </label>
              <input
                type="text"
                value={formData.where}
                onChange={(e) => setFormData((prev) => ({ ...prev, where: e.target.value }))}
                placeholder="Local físico ou sistema..."
                className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-body-md"
              />
              {errors.where && <p className="text-[10px] text-destructive font-mono-data">{errors.where}</p>}
            </div>

            {/* QUANDO (Início & Prazo) */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono-data text-destructive font-bold uppercase block">
                6. QUANDO (Cronograma) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-muted-foreground block font-mono-data">Data Início</span>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-card border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground block font-mono-data">Prazo Final *</span>
                  <input
                    type="date"
                    value={formData.deadlineDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, deadlineDate: e.target.value }))}
                    className="w-full bg-card border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
                  />
                </div>
              </div>
              {errors.deadlineDate && <p className="text-[10px] text-destructive font-mono-data">{errors.deadlineDate}</p>}
            </div>

            {/* QUANTO */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono-data text-primary font-bold uppercase block">
                7. QUANTO (Custo Estimado em {workspaceConfig.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.howMuch}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, howMuch: parseFloat(e.target.value) || 0 }))
                }
                className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-mono-data font-bold"
              />
            </div>
          </div>

          {/* Execution Controls: Priority, Status, Progress */}
          <div className="bg-card p-4 border border-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono-data">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">Prioridade</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))
                }
                className="w-full bg-background border border-input text-foreground p-2 focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="Baixa" className="bg-popover text-foreground">Baixa</option>
                <option value="Média" className="bg-popover text-foreground">Média</option>
                <option value="Alta" className="bg-popover text-foreground">Alta</option>
                <option value="Urgente" className="bg-popover text-foreground">Urgente</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => {
                  const st = e.target.value as TaskStatus;
                  const pct = st === 'Concluído' ? 100 : st === 'Não iniciado' ? 0 : formData.progressPercent;
                  setFormData((prev) => ({
                    ...prev,
                    status: st,
                    progressPercent: pct,
                    completionDate: st === 'Concluído' ? todayStr : '',
                  }));
                }}
                className="w-full bg-background border border-input text-foreground p-2 focus:border-primary focus:outline-none cursor-pointer"
              >
                <option value="Não iniciado" className="bg-popover text-foreground">Não iniciado</option>
                <option value="Em andamento" className="bg-popover text-foreground">Em andamento</option>
                <option value="Concluído" className="bg-popover text-foreground">Concluído</option>
                <option value="Atrasado" className="bg-popover text-foreground">Atrasado</option>
                <option value="Cancelado" className="bg-popover text-foreground">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase block mb-1">
                % Concluído: <span className="text-primary font-bold">{formData.progressPercent}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.progressPercent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    progressPercent: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full accent-primary cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
              Observações Adicionais
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData((prev) => ({ ...prev, observations: e.target.value }))}
              placeholder="Notas, pré-requisitos, restrições..."
              rows={2}
              className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-body-md"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-border bg-background hover:bg-muted text-foreground font-mono-data text-xs uppercase cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 border border-primary bg-primary text-primary-foreground font-mono-data font-bold text-xs uppercase hover:bg-primary/90 cursor-pointer transition-colors"
            >
              {editingTask ? 'Salvar Alterações' : 'Criar Ação 5W2H'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
