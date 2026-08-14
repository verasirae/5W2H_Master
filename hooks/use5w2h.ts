'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task5W2H,
  WorkspaceConfig,
  FilterState,
  TaskPriority,
  TaskStatus,
} from '@/types/5w2h';
import {
  DEFAULT_WORKSPACE_CONFIG,
  INITIAL_SAMPLE_TASKS,
  calculateTaskDeadlineInfo,
} from '@/lib/5w2h-utils';

const STORAGE_KEY_TASKS = '5w2h_master_tasks_v1';
const STORAGE_KEY_CONFIG = '5w2h_master_config_v1';

export type ViewMode = 'dashboard' | 'table' | 'cards' | 'kanban' | 'ai' | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export function use5W2H() {
  const [tasks, setTasks] = useState<Task5W2H[]>(INITIAL_SAMPLE_TASKS);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(DEFAULT_WORKSPACE_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved state from localStorage after initial hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
        if (savedTasks) {
          setTasks(JSON.parse(savedTasks));
        }
        const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
        if (savedConfig) {
          setWorkspaceConfig(JSON.parse(savedConfig));
        }
      } catch (e) {
        console.error('Failed to load saved state:', e);
      } finally {
        setIsLoaded(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task5W2H | null>(null);

  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);
  const [inspectingTask, setInspectingTask] = useState<Task5W2H | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    department: 'Todos',
    category: 'Todas',
    competence: 'Todas',
    status: 'Todos',
    priority: 'Todas',
    who: 'Todos',
    deadlineSituation: 'Todas',
  });


  // Save tasks to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
      } catch (e) {
        console.error('Failed to save tasks:', e);
      }
    }
  }, [tasks, isLoaded]);

  // Save workspace config to localStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(workspaceConfig));
      } catch (e) {
        console.error('Failed to save workspace config:', e);
      }
    }
  }, [workspaceConfig, isLoaded]);

  const showToast = useCallback((type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = Date.now().toString();
    setToast({ id, type, title, message });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  // CRUD Actions
  const addTask = useCallback(
    (newTaskData: Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newId = `TSK-${new Date().getFullYear()}-${(tasks.length + 1).toString().padStart(3, '0')}`;
      const now = new Date().toISOString();

      const newTask: Task5W2H = {
        ...newTaskData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      setTasks((prev) => [newTask, ...prev]);
      showToast('success', 'Tarefa Criada', `A ação "${newTask.title}" foi adicionada com sucesso.`);
      setIsFormModalOpen(false);
      setEditingTask(null);
    },
    [tasks.length, showToast]
  );

  const updateTask = useCallback(
    (id: string, updatedData: Partial<Task5W2H>) => {
      const now = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const nextStatus = updatedData.status ?? t.status;
            const isCompleted = nextStatus === 'Concluído';
            return {
              ...t,
              ...updatedData,
              completionDate: isCompleted
                ? updatedData.completionDate || t.completionDate || new Date().toISOString().slice(0, 10)
                : undefined,
              updatedAt: now,
            };
          }
          return t;
        })
      );
      showToast('success', 'Tarefa Atualizada', 'As alterações na ação 5W2H foram salvas.');
      setIsFormModalOpen(false);
      setEditingTask(null);

      if (inspectingTask?.id === id) {
        setInspectingTask((prev) => (prev ? { ...prev, ...updatedData, updatedAt: now } : null));
      }
    },
    [showToast, inspectingTask?.id]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('info', 'Tarefa Excluída', 'A ação foi removida do sistema.');
      if (inspectingTask?.id === id) {
        setIsMatrixModalOpen(false);
        setInspectingTask(null);
      }
    },
    [showToast, inspectingTask?.id]
  );

  const changeTaskStatus = useCallback(
    (id: string, newStatus: TaskStatus) => {
      const now = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            const progress = newStatus === 'Concluído' ? 100 : newStatus === 'Não iniciado' ? 0 : t.progressPercent === 100 ? 50 : t.progressPercent;
            return {
              ...t,
              status: newStatus,
              progressPercent: progress,
              completionDate: newStatus === 'Concluído' ? new Date().toISOString().slice(0, 10) : undefined,
              updatedAt: now,
            };
          }
          return t;
        })
      );
      showToast('success', 'Status Alterado', `Status atualizado para "${newStatus}".`);
    },
    [showToast]
  );

  const resetToSampleData = useCallback(() => {
    setTasks(INITIAL_SAMPLE_TASKS);
    setWorkspaceConfig(DEFAULT_WORKSPACE_CONFIG);
    showToast('info', 'Dados Restaurados', 'O ambiente foi restaurado com os dados de demonstração.');
  }, [showToast]);

  const clearAllData = useCallback(() => {
    setTasks([]);
    showToast('info', 'Dados Limpos', 'Todas as tarefas foram removidas.');
  }, [showToast]);

  // Derived Filter Options
  const availableDepartments = useMemo(() => {
    const depsFromConfig = workspaceConfig.departments || [];
    const depsFromTasks = Array.from(new Set(tasks.map((t) => t.department))).filter(Boolean);
    return Array.from(new Set([...depsFromConfig, ...depsFromTasks]));
  }, [workspaceConfig.departments, tasks]);

  const availableCategories = useMemo(() => {
    if (filters.department !== 'Todos' && workspaceConfig.categoriesByDepartment[filters.department]) {
      return workspaceConfig.categoriesByDepartment[filters.department];
    }
    const catsFromConfig = Object.values(workspaceConfig.categoriesByDepartment).flat();
    const catsFromTasks = Array.from(new Set(tasks.map((t) => t.category))).filter(Boolean);
    return Array.from(new Set([...catsFromConfig, ...catsFromTasks]));
  }, [filters.department, workspaceConfig.categoriesByDepartment, tasks]);

  const availableCompetences = useMemo(() => {
    const list = Array.from(new Set(tasks.map((t) => t.competence))).filter(Boolean);
    return list.sort().reverse();
  }, [tasks]);

  const availableResponsibles = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.who))).filter(Boolean).sort();
  }, [tasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search Query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesQuery =
          t.title.toLowerCase().includes(query) ||
          t.why.toLowerCase().includes(query) ||
          t.where.toLowerCase().includes(query) ||
          t.who.toLowerCase().includes(query) ||
          t.how.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Department
      if (filters.department !== 'Todos' && t.department !== filters.department) {
        return false;
      }

      // Category
      if (filters.category !== 'Todas' && t.category !== filters.category) {
        return false;
      }

      // Competence
      if (filters.competence !== 'Todas' && t.competence !== filters.competence) {
        return false;
      }

      // Status
      if (filters.status !== 'Todos' && t.status !== filters.status) {
        return false;
      }

      // Priority
      if (filters.priority !== 'Todas' && t.priority !== filters.priority) {
        return false;
      }

      // Who
      if (filters.who !== 'Todos' && t.who !== filters.who) {
        return false;
      }

      // Deadline Situation
      if (filters.deadlineSituation !== 'Todas') {
        const calc = calculateTaskDeadlineInfo(t.deadlineDate, t.status, workspaceConfig.attentionThresholdDays);
        if (calc.deadlineSituation !== filters.deadlineSituation) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, filters, workspaceConfig.attentionThresholdDays]);

  // Modal Triggers
  const openCreateModal = useCallback(() => {
    setEditingTask(null);
    setIsFormModalOpen(true);
  }, []);

  const openEditModal = useCallback((task: Task5W2H) => {
    setEditingTask(task);
    setIsFormModalOpen(true);
  }, []);

  const openMatrixModal = useCallback((task: Task5W2H) => {
    setInspectingTask(task);
    setIsMatrixModalOpen(true);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      department: 'Todos',
      category: 'Todas',
      competence: 'Todas',
      status: 'Todos',
      priority: 'Todas',
      who: 'Todos',
      deadlineSituation: 'Todas',
    });
  }, []);

  return {
    tasks,
    filteredTasks,
    workspaceConfig,
    setWorkspaceConfig,
    isLoaded,
    currentView,
    setCurrentView,
    filters,
    setFilters,
    resetFilters,
    availableDepartments,
    availableCategories,
    availableCompetences,
    availableResponsibles,
    isFormModalOpen,
    setIsFormModalOpen,
    editingTask,
    openCreateModal,
    openEditModal,
    addTask,
    updateTask,
    deleteTask,
    changeTaskStatus,
    isMatrixModalOpen,
    setIsMatrixModalOpen,
    inspectingTask,
    openMatrixModal,
    toast,
    showToast,
    resetToSampleData,
    clearAllData,
  };
}
