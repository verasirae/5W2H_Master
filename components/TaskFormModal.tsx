'use client';

import React, { useState, useEffect } from 'react';
import { Task5W2H, WorkspaceConfig, TaskPriority, TaskStatus } from '@/types/5w2h';
import { X, Save, AlertCircle, User, Users } from 'lucide-react';

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

  const [availableUsers, setAvailableUsers] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    why: '',
    where: '',
    startDate: todayStr,
    deadlineDate: todayStr,
    who: '',
    assignedUserId: undefined as string | undefined,
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

  // Fetch real users from DB on mount
  useEffect(() => {
    if (isOpen) {
      fetch('/api/users')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.users)) {
            setAvailableUsers(data.users.filter((u: any) => u.status === 'ativo' || u.status === 'active'));
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

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
          assignedUserId: editingTask.assignedUserId,
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
          assignedUserId: undefined,
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-4 md:p-6 space-y-4 flex-1">
          {/* Classification Header Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-muted/40 p-3 border border-border">
            <div>
              <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                Departamento *
              </label>
              <select
                value={formData.department}
                onChange={(e) => {
                  const newDept = e.target.value;
                  const newCats = workspaceConfig.categoriesByDepartment[newDept] || ['Geral'];
                  setFormData((prev) => ({
                    ...prev,
                    department: newDept,
                    category: newCats[0] || 'Geral',
                  }));
                }}
                className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
              >
                {workspaceConfig.departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                Rotina / Categoria *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                Competência (MM/AAAA)
              </label>
              <input
                type="text"
                value={formData.competence}
                onChange={(e) => setFormData((prev) => ({ ...prev, competence: e.target.value }))}
                placeholder="MM/AAAA"
                className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
                className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
              >
                <option value="Baixa">Baixa</option>
                <option value="Média">Média</option>
                <option value="Alta">Alta</option>
                <option value="Urgente">Urgente</option>
              </select>
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
              <label className="text-[11px] font-mono-data text-sky-600 dark:text-sky-400 font-bold uppercase block">
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

            {/* QUEM (Responsável) */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono-data text-muted-foreground font-bold uppercase flex items-center justify-between">
                <span>4. QUEM (Responsável) *</span>
                {availableUsers.length > 0 && (
                  <span className="text-[10px] text-primary font-normal">
                    {availableUsers.length} colaboradores cadastrados
                  </span>
                )}
              </label>

              {availableUsers.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={formData.assignedUserId || (availableUsers.find((u) => u.name === formData.who)?.id || '')}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const matched = availableUsers.find((u) => u.id === selectedId);
                      if (matched) {
                        setFormData((prev) => ({
                          ...prev,
                          assignedUserId: matched.id,
                          who: matched.name || matched.email,
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          assignedUserId: undefined,
                        }));
                      }
                    }}
                    className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-mono-data"
                  >
                    <option value="">-- Selecione um Colaborador Cadastrado --</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email} ({u.department || 'Geral'} • {u.role})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={formData.who}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        who: e.target.value,
                        assignedUserId: availableUsers.find((u) => (u.name || u.email) === e.target.value)?.id,
                      }))
                    }
                    placeholder="Ou digite o nome do responsável..."
                    className="w-full bg-card border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-body-md"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={formData.who}
                  onChange={(e) => setFormData((prev) => ({ ...prev, who: e.target.value }))}
                  placeholder="Nome do responsável ou cargo..."
                  className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-body-md"
                />
              )}
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

            {/* QUANTO (Custo) */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono-data text-muted-foreground font-bold uppercase block">
                6. QUANTO (Custo Estimado em {workspaceConfig.currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.howMuch}
                onChange={(e) => setFormData((prev) => ({ ...prev, howMuch: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className="w-full bg-card border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none font-mono-data"
              />
            </div>

            {/* QUANDO (Cronograma) */}
            <div className="space-y-1">
              <label className="text-[11px] font-mono-data text-muted-foreground font-bold uppercase block">
                7. QUANDO (Data Inicial & Prazo Final) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase block font-mono-data">Início</span>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-card border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase block font-mono-data">Prazo (SLA)</span>
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
          </div>

          {/* Status & Execution Section */}
          <div className="border-t border-border pt-4 mt-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data mb-3">
              Controle de Execução & Status
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                  Status Atual
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => {
                    const newStatus = e.target.value as TaskStatus;
                    setFormData((prev) => ({
                      ...prev,
                      status: newStatus,
                      progressPercent: newStatus === 'Concluído' ? 100 : newStatus === 'Não iniciado' ? 0 : prev.progressPercent,
                      completionDate: newStatus === 'Concluído' ? (prev.completionDate || todayStr) : '',
                    }));
                  }}
                  className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data font-bold"
                >
                  <option value="Não iniciado">Não iniciado</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Atrasado">Atrasado</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                  Progresso ({formData.progressPercent}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progressPercent}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setFormData((prev) => ({
                      ...prev,
                      progressPercent: val,
                      status: val === 100 ? 'Concluído' : val > 0 && prev.status === 'Não iniciado' ? 'Em andamento' : prev.status,
                      completionDate: val === 100 ? (prev.completionDate || todayStr) : '',
                    }));
                  }}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                  Data de Conclusão Real
                </label>
                <input
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, completionDate: e.target.value }))}
                  disabled={formData.status !== 'Concluído'}
                  className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-mono-data disabled:opacity-50"
                />
              </div>
            </div>

            {/* Observações */}
            <div className="mt-3">
              <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
                Observações / Anotações de Acompanhamento
              </label>
              <input
                type="text"
                value={formData.observations}
                onChange={(e) => setFormData((prev) => ({ ...prev, observations: e.target.value }))}
                placeholder="Ex: Aguardando aprovação da diretoria ou envio de nota fiscal..."
                className="w-full bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none font-body-md"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-foreground hover:bg-muted text-xs uppercase tracking-wider font-mono-data transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-wider font-mono-data font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              {editingTask ? 'Salvar Alterações' : 'Criar Ação 5W2H'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
