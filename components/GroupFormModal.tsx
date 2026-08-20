'use client';

import React, { useState, useEffect } from 'react';
import { TaskGroup } from '@/types/5w2h';
import { X, FolderKanban, Check } from 'lucide-react';

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupToEdit?: TaskGroup | null;
  onSave: (groupData: { title: string; description?: string; color?: string }) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const COLOR_OPTIONS = [
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Índigo', value: '#6366f1' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Púrpura', value: '#a855f7' },
  { label: 'Carmesim', value: '#ef4444' },
  { label: 'Ciano', value: '#06b6d4' },
  { label: 'Grafite', value: '#64748b' },
];

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  onClose,
  groupToEdit,
  onSave,
  showToast,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevOpen, setPrevOpen] = useState(false);
  const [prevGroup, setPrevGroup] = useState<TaskGroup | null | undefined>(null);

  if (isOpen !== prevOpen || groupToEdit !== prevGroup) {
    setPrevOpen(isOpen);
    setPrevGroup(groupToEdit);
    if (isOpen) {
      if (groupToEdit) {
        setTitle(groupToEdit.title || '');
        setDescription(groupToEdit.description || '');
        setColor(groupToEdit.color || '#3b82f6');
      } else {
        setTitle('');
        setDescription('');
        setColor('#3b82f6');
      }
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('error', 'Campo Obrigatório', 'Informe o título do grupo.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        color,
      });
      onClose();
    } catch (err: any) {
      showToast('error', 'Erro', err.message || 'Erro ao salvar grupo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-card text-card-foreground border border-border w-full max-w-md shadow-2xl overflow-hidden font-mono-data">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">
                {groupToEdit ? 'Editar Grupo de Tarefas' : 'Criar Novo Grupo'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Organize suas listas de ações 5W2H em grupos temáticos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-none cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-foreground uppercase tracking-wider mb-1.5">
              Título do Grupo <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Projetos Estratégicos 2026, Auditoria de Processos..."
              className="w-full bg-background border border-input text-foreground text-xs px-3 py-2 focus:border-primary focus:outline-none"
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-foreground uppercase tracking-wider mb-1.5">
              Descrição / Objetivo
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o escopo geral deste grupo e seus objetivos..."
              rows={3}
              className="w-full bg-background border border-input text-foreground text-xs p-2.5 focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">
              Cor de Identificação
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`w-7 h-7 rounded-none flex items-center justify-center transition-transform cursor-pointer border ${
                    color === c.value
                      ? 'scale-110 border-white shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : 'border-transparent hover:scale-105'
                  }`}
                  title={c.label}
                >
                  {color === c.value && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-background border border-border text-foreground hover:bg-muted transition-colors cursor-pointer uppercase font-semibold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer uppercase font-semibold text-xs"
            >
              {isSubmitting ? 'Salvando...' : groupToEdit ? 'Salvar Alterações' : 'Criar Grupo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
