'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
    role: 'member',
    department: departments[0] || 'RH/DP',
    jobTitle: '',
    status: 'active',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      role: 'member',
      department: departments[0] || 'RH/DP',
      jobTitle: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: AppUser) => {
    setModalMode('edit');
    setEditingUserId(u.id);
    setFormData({
      name: u.name || '',
      email: u.email,
      password: '',
      role: u.role || 'member',
      department: u.department || departments[0] || 'RH/DP',
      jobTitle: u.jobTitle || '',
      status: u.status || 'active',
    });
    setIsModalOpen(true);
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
          showToast('success', 'Usuário Atualizado', 'Os dados do usuário foram atualizados.');
          setIsModalOpen(false);
          fetchUsers();
        } else {
          showToast('error', 'Falha ao atualizar', data.error || 'Erro desconhecido');
        }
      }
    } catch (err: any) {
      showToast('error', 'Erro de comunicação', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, email: string) => {
    if (id === currentUser?.id || email === currentUser?.email) {
      showToast('error', 'Ação Bloqueada', 'Você não pode excluir sua própria conta.');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${email}"? As tarefas associadas serão desvinculadas.`)) {
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          showToast('info', 'Usuário Excluído', `Usuário ${email} foi removido com sucesso.`);
          fetchUsers();
        } else {
          showToast('error', 'Erro ao excluir', data.error);
        }
      } catch (err: any) {
        showToast('error', 'Erro ao excluir', err.message);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q)) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(q));
      if (!matches) return false;
    }
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (departmentFilter !== 'all' && u.department !== departmentFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col space-y-4 overflow-y-auto w-full bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground uppercase tracking-tight font-mono-data">
              Gerenciamento de Usuários (CRUD)
            </h2>
            <p className="text-[11px] text-muted-foreground font-body-md mt-0.5">
              Administre contas de acesso, perfis de permissão, cargos e departamentos integrados ao banco de dados PostgreSQL.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border hover:bg-muted text-foreground font-mono-data text-xs rounded-md transition-colors cursor-pointer"
            title="Atualizar lista de usuários"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            type="button"
            id="btn-create-user"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground font-mono-data font-bold text-xs uppercase rounded-md shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border p-3 rounded-md flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, e-mail, cargo ou depto..."
            className="w-full bg-background border border-border text-foreground text-xs rounded-md pl-9 pr-3 py-1.5 focus:outline-none focus:border-primary font-mono-data"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-background border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary font-mono-data"
          >
            <option value="all">Todas as Funções</option>
            <option value="admin">Administrador</option>
            <option value="manager">Gestor / Gerente</option>
            <option value="member">Membro / Analista</option>
            <option value="viewer">Visualizador</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-background border border-border text-foreground text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-primary font-mono-data"
          >
            <option value="all">Todos os Departamentos</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-md overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground font-mono-data uppercase border-b border-border text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Usuário</th>
                <th className="py-2.5 px-3">Função / Perfil</th>
                <th className="py-2.5 px-3">Departamento</th>
                <th className="py-2.5 px-3">Cargo</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Tarefas</th>
                <th className="py-2.5 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground font-mono-data">
                    {isLoading ? 'Carregando usuários...' : 'Nenhum usuário encontrado.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser?.id || u.email === currentUser?.email;
                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold font-mono-data shrink-0">
                            {u.name ? u.name.slice(0, 2).toUpperCase() : u.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground flex items-center gap-1.5">
                              <span>{u.name || u.email.split('@')[0]}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-mono-data uppercase font-bold">
                                  Você
                                </span>
                              )}
                            </div>
                            <div className="text-muted-foreground text-[11px] font-mono-data flex items-center gap-1">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-data font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              : u.role === 'manager'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-muted text-foreground border border-border'
                          }`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono-data">
                        {u.department ? (
                          <span className="text-foreground">{u.department}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Não atribuído</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono-data">
                        {u.jobTitle ? (
                          <span className="text-foreground">{u.jobTitle}</span>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono-data text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono-data text-muted-foreground uppercase">
                            <XCircle className="w-3.5 h-3.5" />
                            Inativo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono-data text-muted-foreground">
                        <div className="text-[11px]">
                          <span>{u._count?.tasksAssigned || 0} atribuídas</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                            title="Editar Usuário"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className={`p-1.5 rounded transition-colors ${
                              isCurrent
                                ? 'text-muted-foreground/30 cursor-not-allowed'
                                : 'text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer'
                            }`}
                            title={isCurrent ? 'Não é possível excluir a si mesmo' : 'Excluir Usuário'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2 font-mono-data font-bold text-sm text-foreground uppercase">
                <Users className="w-4 h-4 text-primary" />
                <span>{modalMode === 'create' ? 'Cadastrar Novo Usuário' : 'Editar Dados do Usuário'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-mono-data">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-foreground uppercase">Nome Completo</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-foreground uppercase">
                    E-mail Institucional / Login <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled={modalMode === 'edit'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="usuario@empresa.com.br"
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-foreground uppercase flex items-center justify-between">
                    <span>{modalMode === 'create' ? 'Senha Inicial' : 'Redefinir Senha (opcional)'}</span>
                    {modalMode === 'edit' && <span className="text-[10px] text-muted-foreground">Deixe em branco para manter</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={modalMode === 'create' ? 'Mínimo 6 caracteres (padrão: user123456)' : 'Nova senha...'}
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground uppercase">Perfil de Permissão</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="admin">Administrador (Total)</option>
                    <option value="manager">Gestor / Supervisor</option>
                    <option value="member">Membro / Analista</option>
                    <option value="viewer">Visualizador (Somente Leitura)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground uppercase">Status da Conta</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="active">Ativo (Acesso Liberado)</option>
                    <option value="inactive">Inativo (Bloqueado)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground uppercase">Departamento Padrão</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-foreground uppercase">Cargo / Função</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    placeholder="Ex: Analista de DP Senior"
                    className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border text-muted-foreground hover:text-foreground font-mono-data rounded hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold font-mono-data uppercase rounded shadow-xs hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Salvando...' : 'Salvar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
