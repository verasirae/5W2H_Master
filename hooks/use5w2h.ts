'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Task5W2H,
  WorkspaceConfig,
  FilterState,
  TaskStatus,
} from '@/types/5w2h';
import {
  DEFAULT_WORKSPACE_CONFIG,
  INITIAL_SAMPLE_TASKS,
  generateUniqueTaskId,
  deduplicateTaskIds,
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

export interface DatabaseStatus {
  connected: boolean;
  checked: boolean;
  message?: string;
}

export function use5W2H() {
  const [tasks, setTasks] = useState<Task5W2H[]>(() => deduplicateTaskIds(INITIAL_SAMPLE_TASKS));
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(DEFAULT_WORKSPACE_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({ connected: false, checked: false });

  // Load saved state from localStorage first, then sync with Supabase backend
  useEffect(() => {
    const initializeData = async () => {
      // 1. Hydrate from localStorage for instant display
      try {
        const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
        if (savedTasks) {
          const parsed = JSON.parse(savedTasks);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTasks(deduplicateTaskIds(parsed));
          }
        }
        const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
        if (savedConfig) {
          setWorkspaceConfig(JSON.parse(savedConfig));
        }
      } catch (e) {
        console.error('Failed to load local state:', e);
      } finally {
        setIsLoaded(true);
      }

      // 2. Fetch from Supabase backend via API route
      try {
        const res = await fetch('/api/tasks');
        if (res.ok) {
          const data = await res.json();
          if (data.connected) {
            setDbStatus({ connected: true, checked: true });
            if (data.tasks && data.tasks.length > 0) {
              setTasks(deduplicateTaskIds(data.tasks));
            }
          } else {
            setDbStatus({ connected: false, checked: true, message: data.message });
          }
        }
      } catch (err) {
        console.warn('Backend database not reachable or running in offline mode:', err);
        setDbStatus({ connected: false, checked: true });
      }

      // 3. Fetch workspace settings from Supabase if configured
      try {
        const settingRes = await fetch('/api/settings');
        if (settingRes.ok) {
          const settingData = await settingRes.json();
          if (settingData.connected && settingData.config) {
            setWorkspaceConfig(settingData.config);
          }
        }
      } catch (err) {
        console.warn('Backend settings not reachable:', err);
      }
    };

    initializeData();
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

  // Save workspace config to localStorage and Supabase
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

  // CRUD Actions with reactive optimistic UI & backend database sync
  const addTask = useCallback(
    async (newTaskData: Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const createdTitle = newTaskData.title;

      const newId = generateUniqueTaskId(tasks);
      const newTask: Task5W2H = {
        ...newTaskData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };

      // Optimistic state update
      setTasks((prev) => [newTask, ...prev]);

      showToast('success', 'Tarefa Criada', `A ação "${createdTitle}" foi adicionada com sucesso.`);
      setIsFormModalOpen(false);
      setEditingTask(null);

      // Async backend sync to Supabase
      try {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask),
        });
      } catch (e) {
        console.warn('Could not sync created task to database backend:', e);
      }
    },
    [tasks, showToast]
  );

  const addMultipleTasks = useCallback(
    async (newTasksData: Array<Omit<Task5W2H, 'id' | 'createdAt' | 'updatedAt'>>) => {
      if (!newTasksData || newTasksData.length === 0) return;
      const now = new Date().toISOString();

      const createdItems: Task5W2H[] = [];
      setTasks((prev) => {
        let currentList = [...prev];
        for (const item of newTasksData) {
          const newId = generateUniqueTaskId(currentList);
          const newTask: Task5W2H = {
            ...item,
            id: newId,
            createdAt: now,
            updatedAt: now,
          };
          createdItems.push(newTask);
          currentList = [newTask, ...currentList];
        }
        return currentList;
      });

      showToast('success', 'Tarefas Importadas', `${newTasksData.length} planos 5W2H foram adicionados com sucesso.`);

      // Async batch backend sync to Supabase
      try {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createdItems),
        });
      } catch (e) {
        console.warn('Could not sync batch tasks to database backend:', e);
      }
    },
    [showToast]
  );

  const updateTask = useCallback(
    async (id: string, updatedData: Partial<Task5W2H>) => {
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

      // Async sync to Supabase
      try {
        await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedData),
        });
      } catch (e) {
        console.warn('Could not sync task update to database backend:', e);
      }
    },
    [showToast, inspectingTask?.id]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast('info', 'Tarefa Excluída', 'A ação foi removida do sistema.');
      if (inspectingTask?.id === id) {
        setIsMatrixModalOpen(false);
        setInspectingTask(null);
      }

      // Async sync deletion to Supabase
      try {
        await fetch(`/api/tasks/${id}`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.warn('Could not sync deletion to database backend:', e);
      }
    },
    [showToast, inspectingTask?.id]
  );

  const changeTaskStatus = useCallback(
    async (id: string, newStatus: TaskStatus) => {
      const now = new Date().toISOString();
      let updatedProgress = 0;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            updatedProgress = newStatus === 'Concluído' ? 100 : newStatus === 'Não iniciado' ? 0 : t.progressPercent === 100 ? 50 : t.progressPercent;
            return {
              ...t,
              status: newStatus,
              progressPercent: updatedProgress,
              completionDate: newStatus === 'Concluído' ? new Date().toISOString().slice(0, 10) : undefined,
              updatedAt: now,
            };
          }
          return t;
        })
      );
      showToast('success', 'Status Alterado', `Status atualizado para "${newStatus}".`);

      // Async sync to Supabase
      try {
        await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            progressPercent: updatedProgress,
            completionDate: newStatus === 'Concluído' ? new Date().toISOString().slice(0, 10) : null,
          }),
        });
      } catch (e) {
        console.warn('Could not sync status change to database backend:', e);
      }
    },
    [showToast]
  );

  const syncTasksToDatabase = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Sincronização Concluída', `${tasks.length} tarefas sincronizadas com o Supabase.`);
        setDbStatus({ connected: true, checked: true });
      } else {
        showToast('error', 'Falha na Sincronização', data.error || 'Verifique as credenciais do banco.');
      }
    } catch (err: any) {
      showToast('error', 'Erro ao Sincronizar', err.message || 'Não foi possível conectar ao banco.');
    }
  }, [tasks, showToast]);

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

      // Responsible
      if (filters.who !== 'Todos' && t.who !== filters.who) {
        return false;
      }

      return true;
    });
  }, [tasks, filters]);

  return {
    tasks,
    filteredTasks,
    workspaceConfig,
    setWorkspaceConfig,
    currentView,
    setCurrentView,
    filters,
    setFilters,
    availableDepartments,
    availableCategories,
    availableCompetences,
    availableResponsibles,
    isFormModalOpen,
    setIsFormModalOpen,
    editingTask,
    openCreateModal: () => {
      setEditingTask(null);
      setIsFormModalOpen(true);
    },
    openEditModal: (task: Task5W2H) => {
      setEditingTask(task);
      setIsFormModalOpen(true);
    },
    addTask,
    addMultipleTasks,
    updateTask,
    deleteTask,
    changeTaskStatus,
    isMatrixModalOpen,
    setIsMatrixModalOpen,
    inspectingTask,
    openMatrixModal: (task: Task5W2H) => {
      setInspectingTask(task);
      setIsMatrixModalOpen(true);
    },
    toast,
    showToast,
    resetToSampleData,
    clearAllData,
    resetFilters: () => {
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
    },
    dbStatus,
    syncTasksToDatabase,
  };
}
