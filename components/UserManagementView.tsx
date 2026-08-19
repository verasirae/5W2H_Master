'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppUser } from '@/hooks/use5w2h';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Mail,
  Building,
  Briefcase,
  Key,
  X,
  Save,
  Check,
  UserCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface UserManagementViewProps {
  departments: string[];
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  departments,
  showToast,
}) => {
  const { user: currentUser, impersonateUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'membro',
    department: departments[0] || 'RH/DP',
    jobTitle: '',
    status: 'ativo',
    managedDepartments: [] as string[],
    memberDepartments: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImpersonatingId, setIsImpersonatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e: any) {
      showToast('error', 'Erro ao carregar usuários', e.message || 'Falha na requisição');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'membro',
      department: departments[0] || 'RH/DP',
      jobTitle: '',
      status: 'ativo',
      managedDepartments: [],
      memberDepartments: departments[0] ? [departments[0]] : [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setModalMode('edit');
    setEditingUserId(u.id);
    setFormData({
      name: u.name || '',
      email: u.email,
      password: '',
      role: u.role || 'membro',
      department: u.department || departments[0] || 'RH/DP',
      jobTitle: u.jobTitle || '',
      status: u.status || 'ativo',
      managedDepartments: u.managedDepartments || [],
      memberDepartments: u.memberDepartments || (u.department ? [u.department] : []),
    });
    setIsModalOpen(true);
  };

  const handleQuickApprove = async (userId: string, userEmail: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ativo' }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Acesso Aprovado!', `O usuário ${userEmail} agora está ativo.`);
        fetchUsers();
      } else {
        showToast('error', 'Falha ao aprovar', data.error || 'Erro ao atualizar status');
      }
    } catch (e: any) {
      showToast('error', 'Erro de comunicação', e.message);
    }
  };

  const handleImpersonate = async (targetUser: AppUser) => {
    setIsImpersonatingId(targetUser.id);
    try {
      await impersonateUser(targetUser.id);
      showToast(
        'info',
        'Impersonação Ativada',
        `Navegando como ${targetUser.name || targetUser.email} (${targetUser.role.toUpperCase()})`
      );
      window.location.reload();
    } catch (e: any) {
      showToast('error', 'Falha ao impersonar', e.message);
      setIsImpersonatingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      showToast('error', 'Campo obrigatório', 'O e-mail é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          showToast('success', 'Usuário Criado', `O usuário ${formData.email} foi cadastrado.`);
          setIsModalOpen(false);
          fetchUsers();
        } else {
          showToast('error', 'Falha ao cadastrar', data.error || 'Erro desconhecido');
        }
      } else if (modalMode === 'edit' && editingUserId) {
        const res = await fetch(`/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          showToast('success', 'Usuário Atualizado', 'Os dados do usuário foram salvos.');
          setIsModalOpen(false);
          fetchUsers();
        } else {
          showToast('error', 'Falha ao atualizar', data.error || 'Erro desconhecido');
        }
      }
    } catch (e: any) {
      showToast('error', 'Erro ao salvar', e.message || 'Falha na requisição');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (id === currentUser?.id) {
      showToast('error', 'Ação não permitida', 'Você não pode excluir o seu próprio usuário logado.');
      return;
    }

    if (!confirm(`Deseja realmente remover o usuário "${email}"? Todas as permissões vinculadas serão revogadas.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Usuário Removido', `O usuário ${email} foi excluído.`);
        fetchUsers();
      } else {
        showToast('error', 'Falha ao excluir', data.error || 'Erro desconhecido');
      }
    } catch (e: any) {
      showToast('error', 'Erro ao excluir', e.message);
    }
  };

  const pendingCount = useMemo(() => {
    return users.filter((u) => u.status === 'pendente' || u.status === 'pending').length;
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (statusFilter !== 'all') {
        const normStatus = u.status === 'active' ? 'ativo' : u.status === 'pending' ? 'pendente' : u.status === 'inactive' ? 'inativo' : u.status;
        if (normStatus !== statusFilter) return false;
      }

      // Role filter
      if (roleFilter !== 'all') {
        const normRole = u.role === 'member' ? 'membro' : u.role === 'manager' ? 'gestor' : u.role;
        if (normRole !== roleFilter) return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && u.department !== departmentFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchJob = u.jobTitle?.toLowerCase().includes(q);
        const matchDept = u.department?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchJob && !matchDept) return false;
      }

      return true;
    });
  }, [users, statusFilter, roleFilter, departmentFilter, searchQuery]);

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
                Gestão de Usuários & Controle de Acesso (RBAC)
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono-data font-bold border border-amber-500/40">
                    {pendingCount} pendente(s)
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                Cadastre novos colaboradores, aprove solicitações de acesso e defina papéis e departamentos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="px-3 py-1.5 bg-background border border-border hover:bg-muted text-foreground text-xs font-mono-data flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              Atualizar
            </button>

            <button
              onClick={openCreateModal}
              className="px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
          {/* Status Tabs */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-mono-data">
              <Clock className="w-3 h-3 text-primary" />
              Status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-8 px-2 bg-background border border-input text-xs font-mono-data text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendentes ({pendingCount})</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-mono-data">
              <Shield className="w-3 h-3 text-primary" />
              Papel (Role):
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full h-8 px-2 bg-background border border-input text-xs font-mono-data text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Todos os Papéis</option>
              <option value="admin">Admin (Global)</option>
              <option value="gestor">Gestor (Equipe)</option>
              <option value="membro">Membro (Pessoal)</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-mono-data">
              <Building className="w-3 h-3 text-primary" />
              Departamento:
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full h-8 px-2 bg-background border border-input text-xs font-mono-data text-foreground focus:border-primary focus:outline-none"
            >
              <option value="all">Todos os Departamentos</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 font-mono-data">
              <Search className="w-3 h-3 text-primary" />
              Buscar Usuário:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nome, e-mail, cargo..."
              className="w-full h-8 px-2 bg-background border border-input text-xs font-mono-data text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="bg-card border border-border shadow-xs">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-mono-data text-xs space-y-2">
              <p>Nenhum usuário encontrado com os filtros selecionados.</p>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setRoleFilter('all');
                  setDepartmentFilter('all');
                  setSearchQuery('');
                }}
                className="text-primary hover:underline"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono-data">
                <thead>
                  <tr className="bg-muted/60 border-b border-border text-[11px] text-muted-foreground uppercase">
                    <th className="py-2.5 px-3">Colaborador / E-mail</th>
                    <th className="py-2.5 px-3">Papel (Role)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Departamento(s)</th>
                    <th className="py-2.5 px-3">Cargo / Função</th>
                    <th className="py-2.5 px-3">Tarefas (C / A)</th>
                    <th className="py-2.5 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u: any) => {
                    const normRole = u.role === 'member' ? 'membro' : u.role === 'manager' ? 'gestor' : u.role;
                    const normStatus = u.status === 'active' ? 'ativo' : u.status === 'pending' ? 'pendente' : u.status === 'inactive' ? 'inativo' : u.status;
                    const isPending = normStatus === 'pendente';
                    const isCurrent = u.id === currentUser?.id;

                    const roleBadgeClass =
                      normRole === 'admin'
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                        : normRole === 'gestor'
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
                        : 'bg-muted text-muted-foreground border-border';

                    const statusBadgeClass =
                      normStatus === 'ativo'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : normStatus === 'pendente'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';

                    return (
                      <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-background border border-border flex items-center justify-center font-bold text-[11px] text-primary shrink-0">
                              {(u.name || u.email).substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground font-sans text-xs truncate">
                                {u.name || u.email.split('@')[0]}
                                {isCurrent && (
                                  <span className="ml-1.5 text-[9px] px-1 bg-accent text-primary font-mono-data font-normal">
                                    (Você)
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate" title={u.email}>
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${roleBadgeClass}`}>
                            {normRole}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${statusBadgeClass}`}>
                            {normStatus}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-muted-foreground">
                          <div className="max-w-[200px] truncate" title={u.department || 'Geral'}>
                            <span className="font-semibold text-foreground">{u.department || '—'}</span>
                            {normRole === 'gestor' && u.managedDepartments && u.managedDepartments.length > 0 && (
                              <span className="block text-[9px] text-primary truncate">
                                Gere: {u.managedDepartments.join(', ')}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                          {u.jobTitle || '—'}
                        </td>

                        <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground text-[10px]">
                          {u._count ? `${u._count.tasksCreated} / ${u._count.tasksAssigned}` : '0 / 0'}
                        </td>

                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* Quick approve button if pending */}
                            {isPending && (
                              <button
                                onClick={() => handleQuickApprove(u.id, u.email)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                title="Aprovar e Ativar Acesso Imediatamente"
                              >
                                <Check className="w-3 h-3" />
                                Aprovar
                              </button>
                            )}

                            {/* Impersonate Button (for Admin) */}
                            {!isCurrent && (
                              <button
                                onClick={() => handleImpersonate(u)}
                                disabled={isImpersonatingId === u.id}
                                className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-muted transition-colors cursor-pointer"
                                title={`Impersonar (Ver sistema como ${u.name || u.email})`}
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Editar Usuário & Permissões"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            {!isCurrent && (
                              <button
                                onClick={() => handleDelete(u.id, u.email)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* User Form Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-card border border-border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2 font-mono-data">
                <ShieldCheck className="w-4 h-4 text-primary" />
                {modalMode === 'create' ? 'Cadastrar Novo Usuário' : 'Editar Dados e Permissões'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 font-mono-data text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Carlos Oliveira"
                  className="w-full h-8 px-2.5 bg-background border border-input text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                  E-mail de Acesso:
                </label>
                <input
                  type="email"
                  required
                  disabled={modalMode === 'edit'}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="usuario@empresa.com.br"
                  className="w-full h-8 px-2.5 bg-background border border-input text-foreground focus:border-primary focus:outline-none disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                  <span>Senha:</span>
                  {modalMode === 'edit' && (
                    <span className="text-[10px] text-muted-foreground font-normal lowercase">
                      (deixe em branco para não alterar)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={modalMode === 'create' ? 'Mínimo 6 caracteres' : '••••••••'}
                  className="w-full h-8 px-2.5 bg-background border border-input text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              {/* Role & Status Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Papel (Role):
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-8 px-2 bg-background border border-input text-foreground focus:border-primary focus:outline-none font-bold"
                  >
                    <option value="membro">Membro (Acesso Pessoal)</option>
                    <option value="gestor">Gestor (Acesso Equipe)</option>
                    <option value="admin">Admin (Acesso Total)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Status da Conta:
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-8 px-2 bg-background border border-input text-foreground focus:border-primary focus:outline-none font-bold"
                  >
                    <option value="ativo">Ativo (Liberado)</option>
                    <option value="pendente">Pendente (Aguardando)</option>
                    <option value="inativo">Inativo (Bloqueado)</option>
                  </select>
                </div>
              </div>

              {/* Primary Department & Job Title */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Departamento Principal:
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-8 px-2 bg-background border border-input text-foreground focus:border-primary focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Cargo / Função:
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="Ex: Coordenador de DP"
                    className="w-full h-8 px-2.5 bg-background border border-input text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Gestor Managed Departments Multi-select */}
              {formData.role === 'gestor' && (
                <div className="space-y-1.5 p-3 bg-muted/40 border border-border">
                  <label className="text-[11px] font-semibold text-primary uppercase flex items-center justify-between">
                    <span>Departamentos Sob Gestão Deste Usuário:</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      (Múltipla escolha)
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                    {departments.map((dept) => {
                      const isChecked = formData.managedDepartments.includes(dept);
                      return (
                        <label
                          key={dept}
                          className="flex items-center gap-2 text-[11px] text-foreground p-1 bg-background border border-border cursor-pointer hover:border-primary/50"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  managedDepartments: [...formData.managedDepartments, dept],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  managedDepartments: formData.managedDepartments.filter(
                                    (d) => d !== dept
                                  ),
                                });
                              }
                            }}
                            className="rounded-none border-border"
                          />
                          <span className="truncate">{dept}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 bg-background border border-border text-muted-foreground hover:text-foreground text-xs uppercase cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
