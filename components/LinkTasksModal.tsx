'use client';

import React, { useState } from 'react';
import { Task5W2H, TaskList } from '@/types/5w2h';
import {
  X,
  Link,
  Search,
  Check,
  Plus,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { formatShortDate } from '@/lib/5w2h-utils';

interface LinkTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: TaskList | null;
  allTasks: Task5W2H[];
  onTasksLinked: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const LinkTasksModal: React.FC<LinkTasksModalProps> = ({
  isOpen,
  onClose,
  list,
  allTasks,
  onTasksLinked,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !list) return null;

  // Filter tasks that are NOT already in this list
  const availableTasks = allTasks.filter((t) => {
    if (t.listId === list.id) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.who.toLowerCase().includes(q) ||
      t.department.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  const toggleSelect = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === availableTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(availableTasks.map((t) => t.id));
    }
  };

  const handleLinkTasks = async () => {
    if (selectedTaskIds.length === 0) {
      showToast('error', 'Atenção', 'Selecione pelo menos uma tarefa para vincular à lista.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/lists/${list.id}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds: selectedTaskIds, unlink: false }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Tarefas Vinculadas', `${selectedTaskIds.length} tarefa(s) vinculada(s) à lista "${list.title}".`);
        setSelectedTaskIds([]);
        onTasksLinked();
        onClose();
      } else {
        showToast('error', 'Falha ao Vincular', data.error || 'Erro ao vincular tarefas');
      }
    } catch (err: any) {
      showToast('error', 'Erro', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 select-none">
      <div className="bg-card text-card-foreground border border-border w-full max-w-2xl flex flex-col max-h-[85vh] shadow-2xl overflow-hidden font-mono-data">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <Link className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-bold text-foreground">
                Vincular Tarefas à Lista: <span className="text-primary">{list.title}</span>
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Selecione ações 5W2H existentes para integrar a esta lista compartilhada
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

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-border bg-card flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tarefas por título, responsável, departamento..."
              className="w-full bg-background border border-input text-foreground text-xs pl-8 pr-3 py-2 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={availableTasks.length === 0}
              className="px-3 py-1.5 bg-muted text-foreground hover:bg-muted/80 text-xs border border-border transition-colors cursor-pointer"
            >
              {selectedTaskIds.length === availableTasks.length && availableTasks.length > 0
                ? 'Desmarcar Todas'
                : 'Selecionar Todas'}
            </button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 text-xs">
          {availableTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground space-y-2">
              <FileCheck2 className="w-8 h-8 mx-auto opacity-40" />
              <p>Nenhuma tarefa avulsa disponível para vincular.</p>
              <p className="text-[10px]">Todas as tarefas já pertencem a esta lista ou nenhuma corresponde à busca.</p>
            </div>
          ) : (
            availableTasks.map((task) => {
              const isSelected = selectedTaskIds.includes(task.id);
              return (
                <div
                  key={task.id}
                  onClick={() => toggleSelect(task.id)}
                  className={`p-3 border flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-4 h-4 border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-input bg-card'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>

                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">{task.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <span>Resp: <strong className="text-foreground">{task.who}</strong></span>
                        <span>•</span>
                        <span>Prazo: {formatShortDate(task.deadlineDate)}</span>
                        <span>•</span>
                        <span className="px-1 py-0.2 bg-muted text-foreground border border-border">
                          {task.department}
                        </span>
                        <span className="px-1 py-0.2 bg-muted text-foreground border border-border">
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-bold text-primary">
                      {task.progressPercent}%
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {selectedTaskIds.length} de {availableTasks.length} selecionada(s)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-background border border-border text-foreground hover:bg-muted transition-colors cursor-pointer uppercase font-semibold text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleLinkTasks}
              disabled={isSubmitting || selectedTaskIds.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer uppercase font-semibold text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Vinculando...' : `Vincular (${selectedTaskIds.length})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
