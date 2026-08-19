'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import { useAuth } from '@/lib/auth/auth-context';
import { formatCurrency, calculateTaskInfo, getStatusColor } from '@/lib/5w2h-utils';
import {
  Users,
  Building,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Search,
  Filter,
  Eye,
  Edit2,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  UserCheck,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';

interface TeamMonitoringViewProps {
  workspaceConfig: WorkspaceConfig;
  openMatrixModal: (task: Task5W2H) => void;
  openEditModal?: (task: Task5W2H) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

interface TeamMemberStats {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalBudget: number;
  avgProgress: number;
}

export const TeamMonitoringView: React.FC<TeamMonitoringViewProps> = ({
  workspaceConfig,
  openMatrixModal,
  openEditModal,
  showToast,
}) => {
  const { user, isAdmin, isManager } = useAuth();

  const [teamTasks, setTeamTasks] = useState<Task5W2H[]>([]);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Departments this user can manage
  const managedDepartments = useMemo(() => {
    if (isAdmin) {
      return workspaceConfig.departments;
    }
    if (isManager) {
      const depts = user?.managedDepartments && user.managedDepartments.length > 0
        ? user.managedDepartments
        : user?.department ? [user.department] : [];
      return depts.length > 0 ? depts : workspaceConfig.departments;
    }
    return user?.department ? [user.department] : [];
  }, [isAdmin, isManager, user, workspaceConfig.departments]);

  // Selected filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>(
    managedDepartments[0] || 'all'
  );
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch team-scoped tasks and users
  const fetchTeamData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch team-scoped tasks from API
      const taskParams = new URLSearchParams();
      taskParams.append('scope', 'team');
      if (selectedDepartment && selectedDepartment !== 'all') {
        taskParams.append('department', selectedDepartment);
      }

      const tasksRes = await fetch(`/api/tasks?${taskParams.toString()}`);
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        if (Array.isArray(data.tasks)) {
          setTeamTasks(data.tasks);
        }
      }

      // 2. Fetch users list to match department members
      const userParams = new URLSearchParams();
      if (selectedDepartment && selectedDepartment !== 'all') {
        userParams.append('department', selectedDepartment);
      }
      const usersRes = await fetch(`/api/users?${userParams.toString()}`);
      if (usersRes.ok) {
        const userData = await usersRes.json();
        if (Array.isArray(userData.users)) {
          setTeamUsers(userData.users);
        }
      }
    } catch (e: any) {
      showToast('error', 'Erro ao carregar equipe', e.message || 'Falha ao buscar dados');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedDepartment, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeamData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchTeamData]);

  // Distinct assignees in current team tasks
  const availableMembers = useMemo(() => {
    const map = new Map<string, { id?: string; name: string; email?: string }>();
    teamUsers.forEach((u) => {
      if (u.name) {
        map.set(u.name.toLowerCase(), { id: u.id, name: u.name, email: u.email });
      }
    });
    teamTasks.forEach((t) => {
      if (t.who && !map.has(t.who.toLowerCase())) {
        map.set(t.who.toLowerCase(), { id: t.assignedUserId, name: t.who });
      }
    });
    return Array.from(map.values());
  }, [teamUsers, teamTasks]);

  // Filtered Tasks
  const filteredTeamTasks = useMemo(() => {
    return teamTasks.filter((task) => {
      // Dept filter
      if (selectedDepartment !== 'all' && task.department !== selectedDepartment) {
        return false;
      }
      // Assignee filter
      if (selectedAssignee !== 'all') {
        const matchesName = task.who.toLowerCase() === selectedAssignee.toLowerCase();
        const matchesId = task.assignedUserId === selectedAssignee;
        if (!matchesName && !matchesId) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && task.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchWho = task.who.toLowerCase().includes(q);
        const matchWhy = task.why.toLowerCase().includes(q);
        const matchHow = task.how.toLowerCase().includes(q);
        if (!matchTitle && !matchWho && !matchWhy && !matchHow) return false;
      }
      return true;
    });
  }, [teamTasks, selectedDepartment, selectedAssignee, statusFilter, searchQuery]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    const total = filteredTeamTasks.length;
    let completed = 0;
    let inProgress = 0;
    let overdue = 0;
    let notStarted = 0;
    let totalBudget = 0;

    filteredTeamTasks.forEach((t) => {
      totalBudget += Number(t.howMuch) || 0;
      const { deadlineSituation } = calculateTaskInfo(
        t.deadlineDate,
        t.status,
        workspaceConfig.attentionThresholdDays
      );

      if (t.status === 'Concluído') completed++;
      else if (t.status === 'Em andamento') inProgress++;
      else if (t.status === 'Não iniciado') notStarted++;

      if (t.status === 'Atrasado' || deadlineSituation === 'Atrasado') overdue++;
    });

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      overdue,
      notStarted,
      totalBudget,
      completionRate,
    };
  }, [filteredTeamTasks, workspaceConfig.attentionThresholdDays]);

  // Members breakdown statistics
  const memberStats: TeamMemberStats[] = useMemo(() => {
    const map = new Map<string, TeamMemberStats>();

    // Seed with teamUsers
    teamUsers.forEach((u) => {
      const key = (u.name || u.email).toLowerCase();
      map.set(key, {
        id: u.id,
        name: u.name || u.email.split('@')[0],
        email: u.email,
        role: u.role,
        department: u.department,
        totalTasks: 0,
        completedTasks: 0,
        inProgressTasks: 0,
        overdueTasks: 0,
        totalBudget: 0,
        avgProgress: 0,
      });
    });

    // Populate with tasks
    teamTasks.forEach((t) => {
      const key = (t.who || 'Não atribuído').toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          id: t.assignedUserId || key,
          name: t.who || 'Não atribuído',
          email: '',
          role: 'membro',
          department: t.department,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          totalBudget: 0,
          avgProgress: 0,
        });
      }

      const entry = map.get(key)!;
      entry.totalTasks++;
      entry.totalBudget += Number(t.howMuch) || 0;
      entry.avgProgress += Number(t.progressPercent) || 0;

      if (t.status === 'Concluído') entry.completedTasks++;
      else if (t.status === 'Em andamento') entry.inProgressTasks++;

      const { deadlineSituation } = calculateTaskInfo(
        t.deadlineDate,
        t.status,
        workspaceConfig.attentionThresholdDays
      );
      if (t.status === 'Atrasado' || deadlineSituation === 'Atrasado') {
        entry.overdueTasks++;
      }
    });

    return Array.from(map.values()).map((m) => ({
      ...m,
      avgProgress: m.totalTasks > 0 ? Math.round(m.avgProgress / m.totalTasks) : 0,
    }));
  }, [teamUsers, teamTasks, workspaceConfig.attentionThresholdDays]);

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-background">
      {/* Header & Controls */}
      <div className="px-4 md:px-6 py-4 bg-card border-b border-border shrink-0 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                Monitoramento de Equipe & Departamentos
                <span className="text-[10px] px-2 py-0.5 bg-accent text-primary font-mono-data uppercase border border-border">
                  {isAdmin ? 'Acesso Global' : 'Visão de Gestão'}
                </span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Acompanhe o desempenho, SLAs, prazos e entregas dos colaboradores dos seus departamentos.
              </p>
            </div>
          </div>

          <button
            onClick={fetchTeamData}
            disabled={isRefreshing}
            className="self-start sm:self-auto px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground text-xs font-mono-data flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            Atualizar Dados
          </button>
        </div>

        {/* Cascade Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
          {/* 1. Departamento Cascade Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-mono-data">
              <Building className="w-3 h-3 text-primary" />
              1. Departamento:
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedAssignee('all'); // Reset cascade
              }}
              className="w-full h-8 px-2 bg-background border border-input text-xs font-mono-data text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Todos os Departamentos Gerenciados</option>
              {managedDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Colaborador / Pessoa Cascade Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-mono-data">
              <UserCheck className="w-3 h-3 text-primary" />
              2. Colaborador:
            </label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full h-8 px-2 bg-background border border-input text-xs font-mono-data text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Toda a Equipe ({availableMembers.length} pessoas)</option>
              {availableMembers.map((m) => (
                <option key={m.id || m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Status Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-mono-data">
              <SlidersHorizontal className="w-3 h-3 text-primary" />
              3. Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 px-2 bg-background border border-input text-xs font-mono-data text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="Não iniciado">Não iniciado</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Concluído">Concluído</option>
              <option value="Atrasado">Atrasado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          {/* 4. Busca Livre */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-mono-data">
              <Search className="w-3 h-3 text-primary" />
              4. Buscar no Plano:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ação, por quê, como..."
              className="w-full h-8 px-2 bg-background border border-input text-xs font-mono-data text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3.5 bg-card border border-border shadow-xs">
            <span className="text-[11px] font-mono-data uppercase text-muted-foreground flex items-center justify-between">
              Total de Tarefas
              <BarChart3 className="w-3.5 h-3.5 text-primary" />
            </span>
            <p className="text-2xl font-bold font-mono-data text-foreground mt-1">
              {metrics.total}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Taxa de conclusão: {metrics.completionRate}%
            </span>
          </div>

          <div className="p-3.5 bg-card border border-border shadow-xs">
            <span className="text-[11px] font-mono-data uppercase text-muted-foreground flex items-center justify-between">
              Concluídas
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </span>
            <p className="text-2xl font-bold font-mono-data text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics.completed}
            </p>
            <div className="w-full bg-muted h-1 mt-1.5">
              <div
                className="bg-emerald-500 h-1 transition-all"
                style={{ width: `${metrics.completionRate}%` }}
              />
            </div>
          </div>

          <div className="p-3.5 bg-card border border-border shadow-xs">
            <span className="text-[11px] font-mono-data uppercase text-muted-foreground flex items-center justify-between">
              Em Andamento
              <Clock className="w-3.5 h-3.5 text-sky-500" />
            </span>
            <p className="text-2xl font-bold font-mono-data text-sky-600 dark:text-sky-400 mt-1">
              {metrics.inProgress}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              {metrics.notStarted} não iniciadas
            </span>
          </div>

          <div className="p-3.5 bg-card border border-border shadow-xs">
            <span className="text-[11px] font-mono-data uppercase text-muted-foreground flex items-center justify-between">
              Críticas / Atrasadas
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </span>
            <p className="text-2xl font-bold font-mono-data text-rose-600 dark:text-rose-400 mt-1">
              {metrics.overdue}
            </p>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-mono-data">
              {metrics.overdue > 0 ? 'Exige atenção imediata' : 'Nenhuma atrasada'}
            </span>
          </div>

          <div className="p-3.5 bg-card border border-border shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-mono-data uppercase text-muted-foreground flex items-center justify-between">
              Orçamento Alocado
              <DollarSign className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <p className="text-xl font-bold font-mono-data text-foreground mt-1 truncate">
              {formatCurrency(metrics.totalBudget, workspaceConfig.currencySymbol)}
            </p>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Investimento total da equipe
            </span>
          </div>
        </div>

        {/* Team Members Productivity Overview */}
        <div className="bg-card border border-border shadow-xs p-4">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2 font-mono-data">
              <UserCheck className="w-4 h-4 text-primary" />
              Desempenho Individual por Membro da Equipe
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Clique em um membro para filtrar as tarefas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {memberStats.map((member) => {
              const isSelected = selectedAssignee === member.name;
              return (
                <div
                  key={member.name}
                  onClick={() =>
                    setSelectedAssignee(isSelected ? 'all' : member.name)
                  }
                  className={`p-3 border transition-all cursor-pointer select-none relative ${
                    isSelected
                      ? 'bg-accent/60 border-primary shadow-xs'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {member.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono-data truncate">
                        {member.department || 'Geral'} • {member.role}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono-data font-bold px-1.5 py-0.5 bg-muted text-foreground shrink-0 border border-border">
                      {member.totalTasks} ações
                    </span>
                  </div>

                  <div className="mt-2.5 space-y-1.5 font-mono-data text-[10px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Progresso Médio:</span>
                      <span className="font-bold text-foreground">{member.avgProgress}%</span>
                    </div>
                    <div className="w-full bg-muted h-1">
                      <div
                        className="bg-primary h-1"
                        style={{ width: `${member.avgProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓ {member.completedTasks} conc.
                      </span>
                      {member.overdueTasks > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          ⚠ {member.overdueTasks} atrasada(s)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0 atrasos</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-card border border-border shadow-xs">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground font-mono-data flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              Tarefas 5W2H da Equipe ({filteredTeamTasks.length})
            </h3>
            {selectedAssignee !== 'all' && (
              <button
                onClick={() => setSelectedAssignee('all')}
                className="text-[11px] text-primary hover:underline font-mono-data cursor-pointer"
              >
                Limpar filtro de responsável ({selectedAssignee})
              </button>
            )}
          </div>

          {filteredTeamTasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-mono-data text-xs space-y-2">
              <p>Nenhuma tarefa encontrada com os filtros selecionados.</p>
              <p className="text-[11px] opacity-75">
                Altere o departamento ou limpe os filtros de colaborador.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono-data">
                <thead>
                  <tr className="bg-muted/60 border-b border-border text-[11px] text-muted-foreground uppercase">
                    <th className="py-2.5 px-3">O quê (Ação)</th>
                    <th className="py-2.5 px-3">Quem (Responsável)</th>
                    <th className="py-2.5 px-3">Departamento</th>
                    <th className="py-2.5 px-3">Prazo (Quando)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Progresso</th>
                    <th className="py-2.5 px-3 text-right">Quanto (R$)</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTeamTasks.map((task) => {
                    const { deadlineSituation } = calculateTaskInfo(
                      task.deadlineDate,
                      task.status,
                      workspaceConfig.attentionThresholdDays
                    );

                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <td className="py-2.5 px-3 max-w-[240px]">
                          <p className="font-bold text-foreground truncate font-sans text-xs" title={task.title}>
                            {task.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate" title={task.why}>
                            {task.why}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap">
                          {task.who}
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                          {task.department}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 text-[10px] ${
                              deadlineSituation === 'Atrasado'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold'
                                : 'text-foreground'
                            }`}
                          >
                            {task.deadlineDate}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 w-28 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 bg-muted h-1.5">
                              <div
                                className="bg-primary h-1.5"
                                style={{ width: `${task.progressPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {task.progressPercent}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap font-medium text-foreground">
                          {formatCurrency(task.howMuch, workspaceConfig.currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openMatrixModal(task)}
                              className="p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
                              title="Inspecionar Matriz 5W2H"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {openEditModal && (
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                                title="Editar Tarefa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
