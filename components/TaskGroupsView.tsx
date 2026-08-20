'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TaskGroup,
  TaskList,
  Task5W2H,
  WorkspaceConfig,
  TaskStatus,
} from '@/types/5w2h';
import { useAuth } from '@/lib/auth/auth-context';
import {
  FolderKanban,
  ListTodo,
  Plus,
  Search,
  Users,
  Share2,
  Edit2,
  Trash2,
  ChevronRight,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Link,
  Kanban,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  Clock,
  User,
  MoreVertical,
  Unlink,
  Eye,
  Layers,
} from 'lucide-react';
import { ShareListModal } from '@/components/ShareListModal';
import { LinkTasksModal } from '@/components/LinkTasksModal';
import { GroupFormModal } from '@/components/GroupFormModal';
import { ListFormModal } from '@/components/ListFormModal';
import { formatCurrency, formatShortDate, calculateTaskDeadlineInfo } from '@/lib/5w2h-utils';

interface TaskGroupsViewProps {
  workspaceConfig: WorkspaceConfig;
  allTasks: Task5W2H[];
  openCreateTaskModal: () => void;
  openEditTaskModal: (task: Task5W2H) => void;
  openMatrixModal: (task: Task5W2H) => void;
  deleteTask: (id: string) => void;
  changeTaskStatus: (id: string, newStatus: TaskStatus) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  onRefreshAllTasks?: () => void;
}

export const TaskGroupsView: React.FC<TaskGroupsViewProps> = ({
  workspaceConfig,
  allTasks,
  openCreateTaskModal,
  openEditTaskModal,
  openMatrixModal,
  deleteTask,
  changeTaskStatus,
  showToast,
  onRefreshAllTasks,
}) => {
  const { user, isAdmin } = useAuth();

  // Navigation hierarchy:
  // selectedGroupId === null -> Level 1: All Groups
  // selectedGroupId !== null && selectedListId === null -> Level 2: Lists inside Group
  // selectedGroupId !== null && selectedListId !== null -> Level 3: Tasks inside List (Real-time shared)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Groups and Lists data
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<TaskGroup | null>(null);
  const [currentList, setCurrentList] = useState<TaskList | null>(null);
  const [listTasks, setListTasks] = useState<Task5W2H[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'mine' | 'shared'>('all');
  const [listTaskViewMode, setListTaskViewMode] = useState<'table' | 'cards' | 'kanban'>('table');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');

  // Modals state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<TaskGroup | null>(null);

  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<TaskList | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [listToShare, setListToShare] = useState<TaskList | null>(null);

  const [isLinkTasksModalOpen, setIsLinkTasksModalOpen] = useState(false);

  // 1. Fetch all groups
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      if (data.success && Array.isArray(data.groups)) {
        setGroups(data.groups);
      }
    } catch (err: any) {
      console.error('Erro ao buscar grupos:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 2. Fetch specific group details
  const fetchGroupDetails = useCallback(async (groupId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      const data = await res.json();
      if (data.success && data.group) {
        setCurrentGroup(data.group);
      }
    } catch (err: any) {
      console.error('Erro ao buscar detalhes do grupo:', err);
    }
  }, []);

  // 3. Fetch specific list details & tasks (Real-time shared sync)
  const fetchListDetails = useCallback(async (listId: string) => {
    try {
      const res = await fetch(`/api/lists/${listId}`);
      const data = await res.json();
      if (data.success && data.list) {
        setCurrentList(data.list);
        setListTasks(data.list.tasks || []);
      }
    } catch (err: any) {
      console.error('Erro ao carregar detalhes da lista:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    fetch('/api/groups')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && Array.isArray(data.groups)) {
          setGroups(data.groups);
        }
      })
      .catch((err) => console.error('Erro ao buscar grupos:', err));
    return () => {
      isMounted = false;
    };
  }, []);

  // Polling interval for Level 3 (Shared List) to ensure real-time synchronization across members
  useEffect(() => {
    if (!selectedListId) return;
    let isMounted = true;
    const fetchList = async () => {
      try {
        const res = await fetch(`/api/lists/${selectedListId}`);
        const data = await res.json();
        if (isMounted && data.success && data.list) {
          setCurrentList(data.list);
          setListTasks(data.list.tasks || []);
        }
      } catch (err) {
        console.error('Erro ao carregar detalhes da lista:', err);
      }
    };
    fetchList();
    const interval = setInterval(fetchList, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedListId]);

  // Navigation handlers
  const handleSelectGroup = (group: TaskGroup) => {
    setSelectedGroupId(group.id);
    setCurrentGroup(group);
    setSelectedListId(null);
    setCurrentList(null);
    fetchGroupDetails(group.id);
  };

  const handleSelectList = (list: TaskList) => {
    setSelectedListId(list.id);
    setCurrentList(list);
    fetchListDetails(list.id);
  };

  const handleBackToGroups = () => {
    setSelectedGroupId(null);
    setCurrentGroup(null);
    setSelectedListId(null);
    setCurrentList(null);
    fetchGroups();
  };

  const handleBackToLists = () => {
    setSelectedListId(null);
    setCurrentList(null);
    if (selectedGroupId) {
      fetchGroupDetails(selectedGroupId);
    }
  };

  // Group CRUD
  const handleSaveGroup = async (groupData: { title: string; description?: string; color?: string }) => {
    try {
      if (groupToEdit) {
        const res = await fetch(`/api/groups/${groupToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(groupData),
        });
        const data = await res.json();
        if (data.success) {
          showToast('success', 'Grupo Atualizado', 'As informações do grupo foram salvas.');
          fetchGroups();
          if (selectedGroupId === groupToEdit.id) {
            fetchGroupDetails(groupToEdit.id);
          }
        } else {
          showToast('error', 'Erro', data.error || 'Não foi possível atualizar o grupo.');
        }
      } else {
        const res = await fetch('/api/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(groupData),
        });
        const data = await res.json();
        if (data.success) {
          showToast('success', 'Grupo Criado', 'Novo grupo de tarefas criado com sucesso!');
          fetchGroups();
        } else {
          showToast('error', 'Erro', data.error || 'Não foi possível criar o grupo.');
        }
      }
    } catch (err: any) {
      showToast('error', 'Erro', err.message);
    }
  };

  const handleDeleteGroup = async (group: TaskGroup, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Tem certeza que deseja excluir o grupo "${group.title}" e todas as suas listas?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/groups/${group.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Grupo Excluído', 'Grupo removido com sucesso.');
        if (selectedGroupId === group.id) {
          handleBackToGroups();
        } else {
          fetchGroups();
        }
      } else {
        showToast('error', 'Erro', data.error || 'Não foi possível excluir o grupo.');
      }
    } catch (err: any) {
      showToast('error', 'Erro', err.message);
    }
  };

  // List CRUD
  const handleSaveList = async (listData: { title: string; description?: string; color?: string; groupId: string }) => {
    try {
      if (listToEdit) {
        const res = await fetch(`/api/lists/${listToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(listData),
        });
        const data = await res.json();
        if (data.success) {
          showToast('success', 'Lista Atualizada', 'As informações da lista foram salvas.');
          if (selectedGroupId) fetchGroupDetails(selectedGroupId);
          if (selectedListId === listToEdit.id) fetchListDetails(listToEdit.id);
        } else {
          showToast('error', 'Erro', data.error || 'Não foi possível atualizar a lista.');
        }
      } else {
        const res = await fetch('/api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(listData),
        });
        const data = await res.json();
        if (data.success) {
          showToast('success', 'Lista Criada', 'Nova lista compartilhável criada com sucesso!');
          if (selectedGroupId) fetchGroupDetails(selectedGroupId);
        } else {
          showToast('error', 'Erro', data.error || 'Não foi possível criar a lista.');
        }
      }
    } catch (err: any) {
      showToast('error', 'Erro', err.message);
    }
  };

  const handleDeleteList = async (list: TaskList, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Deseja realmente excluir a lista "${list.title}"? As tarefas associadas retornarão para a visualização individual.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/lists/${list.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Lista Excluída', 'Lista removida com sucesso.');
        if (selectedListId === list.id) {
          handleBackToLists();
        } else if (selectedGroupId) {
          fetchGroupDetails(selectedGroupId);
        }
      } else {
        showToast('error', 'Erro', data.error || 'Não foi possível excluir a lista.');
      }
    } catch (err: any) {
      showToast('error', 'Erro', err.message);
    }
  };

  // Unlink single task from list
  const handleUnlinkTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedListId) return;
    if (!confirm('Deseja desvincular esta tarefa da lista compartilhada? A tarefa continuará existindo normalmente no sistema.')) {
      return;
    }

    try {
      const res = await fetch(`/api/lists/${selectedListId}/tasks?taskId=${taskId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('info', 'Tarefa Desvinculada', 'A tarefa foi removida desta lista compartilhada.');
        fetchListDetails(selectedListId);
        if (onRefreshAllTasks) onRefreshAllTasks();
      } else {
        showToast('error', 'Erro', data.error || 'Não foi possível desvincular a tarefa.');
      }
    } catch (err: any) {
      showToast('error', 'Erro', err.message);
    }
  };

  // Filter groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      // Ownership filter
      if (ownershipFilter === 'mine' && g.ownerId !== user?.id) return false;
      if (ownershipFilter === 'shared' && g.ownerId === user?.id) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)) ||
        (g.owner?.name && g.owner.name.toLowerCase().includes(q)) ||
        (g.owner?.email && g.owner.email.toLowerCase().includes(q))
      );
    });
  }, [groups, ownershipFilter, searchQuery, user?.id]);

  // Filter tasks inside current list
  const filteredListTasks = useMemo(() => {
    return listTasks.filter((t) => {
      if (taskStatusFilter !== 'all' && t.status !== taskStatusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.who.toLowerCase().includes(q) ||
        t.how.toLowerCase().includes(q) ||
        t.why.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [listTasks, taskStatusFilter, searchQuery]);

  // Calculate metrics
  const totalGroupsCount = groups.length;
  const totalListsCount = groups.reduce((acc, g) => acc + (g.lists?.length || 0), 0);
  const totalSharedCount = groups.filter((g) => g.ownerId !== user?.id).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background select-none font-mono-data">
      {/* ========================================================================= */}
      {/* LEVEL 1: ALL GROUPS DASHBOARD                                            */}
      {/* ========================================================================= */}
      {!selectedGroupId && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Top Control Header */}
          <div className="p-4 md:p-5 border-b border-border bg-card flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shrink-0 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-none bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-bold text-foreground tracking-tight">
                    Grupos e Listas Compartilhadas
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    Crie grupos de trabalho, compartilhe listas 5W2H e colabore em tempo real com sua equipe
                  </p>
                </div>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={fetchGroups}
                disabled={isLoading}
                className="p-2 border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Atualizar lista de grupos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => {
                  setGroupToEdit(null);
                  setIsGroupModalOpen(true);
                }}
                className="px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Grupo</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 md:px-5 md:py-3 border-b border-border bg-muted/20 shrink-0 text-xs">
            <div className="p-3 bg-card border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total de Grupos</span>
              <span className="text-lg font-bold text-foreground mt-0.5 block">{totalGroupsCount}</span>
            </div>
            <div className="p-3 bg-card border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Listas Vinculadas</span>
              <span className="text-lg font-bold text-primary mt-0.5 block">{totalListsCount}</span>
            </div>
            <div className="p-3 bg-card border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Criados por Mim</span>
              <span className="text-lg font-bold text-emerald-500 mt-0.5 block">
                {groups.filter((g) => g.ownerId === user?.id).length}
              </span>
            </div>
            <div className="p-3 bg-card border border-border">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Compartilhados Comigo</span>
              <span className="text-lg font-bold text-blue-500 mt-0.5 block">{totalSharedCount}</span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 md:px-5 border-b border-border bg-card flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar grupos por título, descrição ou criador..."
                className="w-full bg-background border border-input text-foreground text-xs pl-8 pr-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setOwnershipFilter('all')}
                className={`px-3 py-1.5 text-xs uppercase font-semibold transition-colors cursor-pointer border ${
                  ownershipFilter === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                Todos ({totalGroupsCount})
              </button>
              <button
                onClick={() => setOwnershipFilter('mine')}
                className={`px-3 py-1.5 text-xs uppercase font-semibold transition-colors cursor-pointer border ${
                  ownershipFilter === 'mine'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                Meus Grupos
              </button>
              <button
                onClick={() => setOwnershipFilter('shared')}
                className={`px-3 py-1.5 text-xs uppercase font-semibold transition-colors cursor-pointer border ${
                  ownershipFilter === 'shared'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                Compartilhados
              </button>
            </div>
          </div>

          {/* Groups Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-44 bg-card border border-border animate-pulse p-4" />
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="h-72 border border-dashed border-border flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-muted flex items-center justify-center text-muted-foreground">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Nenhum grupo encontrado</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {searchQuery || ownershipFilter !== 'all'
                      ? 'Nenhum grupo corresponde aos filtros selecionados.'
                      : 'Comece criando seu primeiro grupo de tarefas para organizar listas compartilhadas 5W2H.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGroupToEdit(null);
                    setIsGroupModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Primeiro Grupo</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGroups.map((group) => {
                  const isOwner = group.ownerId === user?.id || isAdmin;
                  const listsCount = group.lists?.length || group._count?.lists || 0;

                  return (
                    <div
                      key={group.id}
                      onClick={() => handleSelectGroup(group)}
                      className="bg-card border border-border hover:border-primary transition-all p-4.5 flex flex-col justify-between group shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden"
                    >
                      {/* Top Color Accent Stripe */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: group.color || '#3b82f6' }}
                      />

                      {/* Header info */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: group.color || '#3b82f6' }}
                            />
                            <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {group.title}
                            </h3>
                          </div>

                          {/* Ownership Badge */}
                          <span
                            className={`text-[9px] px-1.5 py-0.2 uppercase font-bold shrink-0 border ${
                              group.ownerId === user?.id
                                ? 'bg-primary/10 text-primary border-primary/30'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {group.ownerId === user?.id ? 'Meu Grupo' : 'Compartilhado'}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2 min-h-8 mb-3">
                          {group.description || 'Sem descrição cadastrada para este grupo.'}
                        </p>
                      </div>

                      {/* Footer & Meta */}
                      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1.5">
                            <ListTodo className="w-3.5 h-3.5 text-primary" />
                            <strong className="text-foreground">{listsCount}</strong> lista(s)
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          {isOwner && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGroupToEdit(group);
                                  setIsGroupModalOpen(true);
                                }}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Editar grupo"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteGroup(group, e)}
                                className="p-1.5 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                title="Excluir grupo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          <div className="flex items-center gap-1 text-primary text-[11px] font-semibold uppercase group-hover:translate-x-0.5 transition-transform ml-1">
                            <span>Abrir</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: LISTS INSIDE SELECTED GROUP                                     */}
      {/* ========================================================================= */}
      {selectedGroupId && !selectedListId && currentGroup && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Breadcrumbs & Group Header */}
          <div className="p-4 md:p-5 border-b border-border bg-card shrink-0 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <button
                onClick={handleBackToGroups}
                className="hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Grupos</span>
              </button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-bold">{currentGroup.title}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-none flex items-center justify-center text-white font-bold text-sm shadow-xs"
                  style={{ backgroundColor: currentGroup.color || '#3b82f6' }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-base md:text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
                    {currentGroup.title}
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    {currentGroup.description || 'Listas de tarefas 5W2H vinculadas a este grupo'}
                  </p>
                </div>
              </div>

              {/* Group Action Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                {(currentGroup.ownerId === user?.id || isAdmin) && (
                  <button
                    onClick={() => {
                      setGroupToEdit(currentGroup);
                      setIsGroupModalOpen(true);
                    }}
                    className="px-3 py-2 bg-background border border-border text-foreground hover:bg-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Editar Grupo</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setListToEdit(null);
                    setIsListModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Lista Compartilhável</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search bar inside group */}
          <div className="p-4 md:px-5 border-b border-border bg-card flex items-center justify-between shrink-0">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar listas dentro deste grupo..."
                className="w-full bg-background border border-input text-foreground text-xs pl-8 pr-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Lists Grid */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5">
            {!currentGroup.lists || currentGroup.lists.length === 0 ? (
              <div className="h-64 border border-dashed border-border flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-muted flex items-center justify-center text-muted-foreground">
                  <ListTodo className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Nenhuma lista neste grupo</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Crie listas de tarefas 5W2H para compartilhar com seus colegas e gerenciar a execução sincronizada.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setListToEdit(null);
                    setIsListModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Criar Nova Lista</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentGroup.lists
                  .filter((l) =>
                    searchQuery
                      ? l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      : true
                  )
                  .map((list) => {
                    const isListOwner = list.ownerId === user?.id || isAdmin;
                    const membersCount = list.members?.length || list._count?.members || 1;
                    const tasksCount = list._count?.tasks || list.tasks?.length || 0;

                    return (
                      <div
                        key={list.id}
                        onClick={() => handleSelectList(list)}
                        className="bg-card border border-border hover:border-primary transition-all p-4 flex flex-col justify-between group shadow-sm hover:shadow-md cursor-pointer relative overflow-hidden"
                      >
                        {/* Top Color Stripe */}
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ backgroundColor: list.color || currentGroup.color || '#3b82f6' }}
                        />

                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: list.color || '#3b82f6' }}
                              />
                              <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {list.title}
                              </h3>
                            </div>

                            <span
                              className={`text-[9px] px-1.5 py-0.2 uppercase font-bold shrink-0 border ${
                                list.ownerId === user?.id
                                  ? 'bg-primary/10 text-primary border-primary/30'
                                  : 'bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              {list.ownerId === user?.id ? 'Proprietário' : 'Membro'}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground line-clamp-2 min-h-8 mb-3">
                            {list.description || 'Lista compartilhada de tarefas 5W2H.'}
                          </p>
                        </div>

                        {/* Members and Tasks badges */}
                        <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground mt-2">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5" title="Total de tarefas 5W2H">
                              <ListTodo className="w-3.5 h-3.5 text-primary" />
                              <strong className="text-foreground">{tasksCount}</strong> tarefas
                            </span>
                            <span className="flex items-center gap-1.5" title="Membros colaborando">
                              <Users className="w-3.5 h-3.5 text-muted-foreground" />
                              <strong className="text-foreground">{membersCount}</strong> membros
                            </span>
                          </div>

                          {/* Action icons */}
                          <div className="flex items-center gap-1">
                            {/* Share button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setListToShare(list);
                                setIsShareModalOpen(true);
                              }}
                              className="p-1.5 text-primary hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-colors cursor-pointer"
                              title="Compartilhar lista e gerenciar membros"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {isListOwner && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setListToEdit(list);
                                    setIsListModalOpen(true);
                                  }}
                                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                  title="Editar lista"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteList(list, e)}
                                  className="p-1.5 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                  title="Excluir lista"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}

                            <div className="flex items-center gap-1 text-primary text-[11px] font-semibold uppercase group-hover:translate-x-0.5 transition-transform ml-1">
                              <span>Abrir</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: TASKS IN REAL-TIME SHARED LIST                                  */}
      {/* ========================================================================= */}
      {selectedGroupId && selectedListId && currentList && (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header with breadcrumbs and real-time banner */}
          <div className="p-4 md:p-5 border-b border-border bg-card shrink-0 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <button
                onClick={handleBackToGroups}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Grupos
              </button>
              <ChevronRight className="w-3 h-3" />
              <button
                onClick={handleBackToLists}
                className="hover:text-foreground transition-colors cursor-pointer font-semibold"
              >
                {currentGroup?.title || 'Grupo'}
              </button>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-bold">{currentList.title}</span>
            </div>

            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
              {/* Title & info */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-none flex items-center justify-center text-white font-bold text-sm shadow-xs shrink-0"
                  style={{ backgroundColor: currentList.color || '#3b82f6' }}
                >
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base md:text-lg font-bold text-foreground tracking-tight">
                      {currentList.title}
                    </h1>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Sincronização em Tempo Real</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {currentList.description || 'Tarefas compartilhadas e colaborativas 5W2H'}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
                {/* Share Button with Members Count */}
                <button
                  onClick={() => {
                    setListToShare(currentList);
                    setIsShareModalOpen(true);
                  }}
                  className="px-3 py-2 bg-background border border-border text-foreground hover:bg-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                  title="Compartilhar lista e gerenciar convites/membros"
                >
                  <Share2 className="w-3.5 h-3.5 text-primary" />
                  <span>Compartilhar</span>
                  <span className="px-1.5 py-0.2 bg-muted text-muted-foreground text-[10px] font-mono-data border border-border">
                    {(currentList.members?.length || 1)} membros
                  </span>
                </button>

                {/* Link existing tasks button */}
                <button
                  onClick={() => setIsLinkTasksModalOpen(true)}
                  className="px-3 py-2 bg-background border border-border text-foreground hover:bg-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Vincular tarefas 5W2H existentes a esta lista"
                >
                  <Link className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Vincular Tarefas</span>
                </button>

                {/* Add new 5W2H task button */}
                <button
                  onClick={openCreateTaskModal}
                  className="px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Tarefa 5W2H</span>
                </button>
              </div>
            </div>
          </div>

          {/* Subheader: View Switcher, Search, and Status Filter */}
          <div className="p-3 md:px-5 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0 text-xs">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar nesta lista..."
                className="w-full bg-background border border-input text-foreground text-xs pl-8 pr-3 py-1.5 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Filter and View Mode switch */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <select
                value={taskStatusFilter}
                onChange={(e) => setTaskStatusFilter(e.target.value)}
                className="bg-background border border-input text-foreground text-xs px-2.5 py-1.5 focus:border-primary focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="Não iniciado">Não iniciado</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Concluído">Concluído</option>
                <option value="Atrasado">Atrasado</option>
                <option value="Cancelado">Cancelado</option>
              </select>

              <div className="flex items-center border border-border bg-background">
                <button
                  onClick={() => setListTaskViewMode('table')}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    listTaskViewMode === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Visualização em Tabela"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setListTaskViewMode('cards')}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    listTaskViewMode === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setListTaskViewMode('kanban')}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    listTaskViewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Visualização Kanban"
                >
                  <Kanban className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => fetchListDetails(currentList.id)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted border border-border bg-background transition-colors cursor-pointer"
                title="Atualizar tarefas agora"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List Tasks Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-5">
            {filteredListTasks.length === 0 ? (
              <div className="h-64 border border-dashed border-border flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-muted flex items-center justify-center text-muted-foreground">
                  <ListTodo className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Nenhuma tarefa nesta lista ainda</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Adicione novas ações 5W2H ou vincule tarefas existentes da sua equipe para colaborar em tempo real.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setIsLinkTasksModalOpen(true)}
                    className="px-3 py-2 bg-background border border-border text-foreground hover:bg-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Link className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Vincular Existentes</span>
                  </button>
                  <button
                    onClick={openCreateTaskModal}
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Nova Tarefa</span>
                  </button>
                </div>
              </div>
            ) : listTaskViewMode === 'table' ? (
              /* TABULAR VIEW */
              <div className="border border-border bg-card overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                      <th className="p-3">O quê (Ação)</th>
                      <th className="p-3">Quem (Resp.)</th>
                      <th className="p-3">Quando (Prazo)</th>
                      <th className="p-3">Quanto (Custo)</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Progresso</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredListTasks.map((task) => {
                      const deadlineInfo = calculateTaskDeadlineInfo(
                        task.deadlineDate,
                        task.status,
                        workspaceConfig.attentionThresholdDays
                      );

                      return (
                        <tr key={task.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 max-w-xs">
                            <p className="font-semibold text-foreground truncate">{task.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{task.why}</p>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium text-foreground">{task.who}</span>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-foreground">{formatShortDate(task.deadlineDate)}</span>
                            <span className="block text-[10px] text-muted-foreground">
                              {deadlineInfo.daysRemaining >= 0
                                ? `${deadlineInfo.daysRemaining} dias rest.`
                                : `${Math.abs(deadlineInfo.daysRemaining)} dias atr.`}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="text-foreground">{formatCurrency(task.howMuch)}</span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <select
                              value={task.status}
                              onChange={(e) => changeTaskStatus(task.id, e.target.value as TaskStatus)}
                              className="bg-background border border-input text-foreground text-xs px-2 py-1 focus:border-primary focus:outline-none"
                            >
                              <option value="Não iniciado">Não iniciado</option>
                              <option value="Em andamento">Em andamento</option>
                              <option value="Concluído">Concluído</option>
                              <option value="Atrasado">Atrasado</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-muted h-2 border border-border">
                                <div
                                  className="bg-primary h-full transition-all"
                                  style={{ width: `${task.progressPercent}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-foreground">{task.progressPercent}%</span>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openMatrixModal(task)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Ver Matriz 5W2H"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openEditTaskModal(task)}
                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Editar tarefa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleUnlinkTask(task.id, e)}
                                className="p-1.5 text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                                title="Desvincular da lista compartilhada"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                title="Excluir tarefa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : listTaskViewMode === 'cards' ? (
              /* CARDS VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredListTasks.map((task) => (
                  <div key={task.id} className="bg-card border border-border p-4 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-sm text-foreground line-clamp-1">{task.title}</h4>
                        <span className="text-[10px] px-1.5 py-0.2 bg-muted text-muted-foreground border border-border">
                          {task.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.why}</p>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <p><strong>Quem:</strong> {task.who}</p>
                        <p><strong>Quando:</strong> {formatShortDate(task.deadlineDate)}</p>
                        <p><strong>Quanto:</strong> {formatCurrency(task.howMuch)}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between text-xs mt-3">
                      <span className="font-bold text-primary">{task.progressPercent}% Concluído</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openMatrixModal(task)}
                          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Matriz 5W2H"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditTaskModal(task)}
                          className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleUnlinkTask(task.id, e)}
                          className="p-1 text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                          title="Desvincular"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* KANBAN VIEW */
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['Não iniciado', 'Em andamento', 'Concluído', 'Atrasado'].map((statusKey) => {
                  const columnTasks = filteredListTasks.filter((t) => t.status === statusKey);
                  return (
                    <div key={statusKey} className="bg-muted/30 border border-border p-3 flex flex-col max-h-[70vh]">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border font-bold text-xs uppercase">
                        <span>{statusKey}</span>
                        <span className="px-1.5 py-0.2 bg-background border border-border text-foreground">
                          {columnTasks.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2">
                        {columnTasks.map((t) => (
                          <div key={t.id} className="p-3 bg-card border border-border shadow-xs text-xs space-y-1.5">
                            <h5 className="font-semibold text-foreground line-clamp-2">{t.title}</h5>
                            <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                              <span>{t.who}</span>
                              <span>{formatShortDate(t.deadlineDate)}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                              <span className="font-bold text-primary">{t.progressPercent}%</span>
                              <button
                                onClick={() => openEditTaskModal(t)}
                                className="text-primary hover:underline cursor-pointer"
                              >
                                Editar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. Group Create/Edit Modal */}
      <GroupFormModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setGroupToEdit(null);
        }}
        groupToEdit={groupToEdit}
        onSave={handleSaveGroup}
        showToast={showToast}
      />

      {/* 2. List Create/Edit Modal */}
      <ListFormModal
        isOpen={isListModalOpen}
        onClose={() => {
          setIsListModalOpen(false);
          setListToEdit(null);
        }}
        groupId={selectedGroupId || ''}
        groupTitle={currentGroup?.title}
        listToEdit={listToEdit}
        onSave={handleSaveList}
        showToast={showToast}
      />

      {/* 3. Share List & Members Modal */}
      <ShareListModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setListToShare(null);
        }}
        list={listToShare}
        onUpdateList={() => {
          if (selectedGroupId) fetchGroupDetails(selectedGroupId);
          if (selectedListId) fetchListDetails(selectedListId);
          fetchGroups();
        }}
        showToast={showToast}
      />

      {/* 4. Link Tasks Modal */}
      <LinkTasksModal
        isOpen={isLinkTasksModalOpen}
        onClose={() => setIsLinkTasksModalOpen(false)}
        list={currentList}
        allTasks={allTasks}
        onTasksLinked={() => {
          if (selectedListId) fetchListDetails(selectedListId);
          if (onRefreshAllTasks) onRefreshAllTasks();
        }}
        showToast={showToast}
      />
    </div>
  );
};
