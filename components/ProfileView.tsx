'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Task5W2H } from '@/types/5w2h';
import {
  User,
  Shield,
  Key,
  Building,
  Briefcase,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Save,
  LogOut,
  ListTodo,
  ExternalLink,
  Lock,
} from 'lucide-react';

interface ProfileViewProps {
  departments: string[];
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  openEditModal: (task: Task5W2H) => void;
  openMatrixModal: (task: Task5W2H) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  departments,
  showToast,
  openEditModal,
  openMatrixModal,
}) => {
  const { user, getUserDisplayName, getUserInitials, signOut } = useAuth();

  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState(departments[0] || 'RH/DP');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [assignedTasks, setAssignedTasks] = useState<Task5W2H[]>([]);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users/profile');
      const data = await res.json();
      if (data.success && data.user) {
        setName(data.user.name || '');
        setJobTitle(data.user.jobTitle || '');
        setDepartment(data.user.department || departments[0] || 'RH/DP');
        if (Array.isArray(data.user.tasksAssigned)) {
          setAssignedTasks(data.user.tasksAssigned);
        }
        if (data.user.stats) {
          setStats(data.user.stats);
        }
      }
    } catch (e: any) {
      showToast('error', 'Erro ao carregar perfil', e.message);
    } finally {
      setIsLoading(false);
    }
  }, [departments, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword && newPassword.length < 6) {
      showToast('error', 'Senha muito curta', 'A nova senha deve conter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast('error', 'Senhas divergentes', 'A confirmação de senha não confere com a nova senha.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          jobTitle,
          department,
          ...(newPassword && {
            currentPassword,
            newPassword,
          }),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Perfil Atualizado', 'Seus dados foram atualizados com sucesso no banco de dados.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchProfile();
      } else {
        showToast('error', 'Falha ao atualizar', data.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      showToast('error', 'Erro de comunicação', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col space-y-4 overflow-y-auto w-full bg-background">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground uppercase tracking-tight font-mono-data">
              Meu Perfil & Atividades
            </h2>
            <p className="text-[11px] text-muted-foreground font-body-md mt-0.5">
              Gerencie suas informações pessoais, cargo, departamento, senha de acesso e acompanhe suas tarefas atribuídas.
            </p>
          </div>
        </div>

        <button
          type="button"
          id="btn-profile-logout"
          onClick={async () => {
            await signOut();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground font-mono-data font-bold text-xs uppercase rounded-md transition-colors cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair da Conta (Logout)</span>
        </button>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-card border border-border p-5 rounded-md shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="flex flex-col items-center text-center p-4 border border-border bg-muted/20 rounded-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary text-primary flex items-center justify-center font-bold text-2xl font-mono-data mb-3 shadow-inner">
            {getUserInitials()}
          </div>
          <h3 className="font-bold text-base text-foreground">{getUserDisplayName()}</h3>
          <p className="text-xs text-muted-foreground font-mono-data mt-0.5">{user?.email || 'usuario@5w2h.local'}</p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 rounded-full text-[10px] font-mono-data font-bold uppercase">
              <Shield className="w-3 h-3" />
              {user?.role || 'admin'}
            </span>
            {department && (
              <span className="px-2.5 py-0.5 bg-muted text-foreground border border-border rounded-full text-[10px] font-mono-data uppercase">
                {department}
              </span>
            )}
          </div>

          <div className="w-full mt-5 pt-4 border-t border-border space-y-2 text-left text-xs font-mono-data">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Cargo / Função:</span>
              <span className="text-foreground font-semibold">{jobTitle || 'Não especificado'}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Autenticação:</span>
              <span className="text-foreground capitalize">{user?.provider || 'local'}</span>
            </div>
          </div>
        </div>

        {/* Form Edit Profile & Password */}
        <form onSubmit={handleUpdateProfile} className="lg:col-span-2 space-y-4 text-xs font-mono-data">
          <div className="border-b border-border pb-2">
            <h4 className="font-bold text-xs uppercase text-foreground">Informações Cadastrais</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase">Nome de Exibição</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase">Departamento Padrão</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[11px] font-bold text-foreground uppercase">Cargo / Função Profissional</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Gestor de Processos e Qualidade"
                className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
              />
            </div>
          </div>

          <div className="border-b border-border pb-2 pt-2">
            <h4 className="font-bold text-xs uppercase text-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-primary" />
              <span>Segurança & Alteração de Senha</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Senha Atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Senha atual..."
                className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 dígitos..."
                className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha..."
                className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold font-mono-data text-xs uppercase rounded shadow-xs hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border p-3.5 rounded-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-mono-data font-semibold">Total Atribuídas</p>
            <p className="text-xl font-bold text-foreground font-mono-data">{stats.totalAssigned}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-3.5 rounded-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-mono-data font-semibold">Concluídas</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono-data">{stats.completed}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-3.5 rounded-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-mono-data font-semibold">Em Andamento</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400 font-mono-data">{stats.pending}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-3.5 rounded-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-destructive/10 text-destructive flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-mono-data font-semibold">Atrasadas</p>
            <p className="text-xl font-bold text-destructive font-mono-data">{stats.overdue}</p>
          </div>
        </div>
      </div>

      {/* Assigned Tasks Section */}
      <div className="bg-card border border-border rounded-md p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground uppercase font-mono-data">
              Minhas Ações 5W2H Atribuídas ({assignedTasks.length})
            </h3>
          </div>
        </div>

        {assignedTasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-xs font-mono-data">
            Nenhuma tarefa atribuída diretamente a você no momento.
          </div>
        ) : (
          <div className="space-y-2">
            {assignedTasks.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 bg-background border border-border rounded hover:border-primary/50 transition-colors gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-foreground truncate">{t.title}</span>
                    <span className="text-[10px] font-mono-data px-1.5 py-0.2 bg-muted text-muted-foreground rounded">
                      {t.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono-data">
                    <span>Depto: {t.department}</span>
                    <span>Prazo: {t.deadlineDate}</span>
                    <span className="font-bold text-foreground">Status: {t.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openMatrixModal(t)}
                    className="px-2.5 py-1 text-[11px] bg-muted hover:bg-primary hover:text-primary-foreground font-mono-data font-bold rounded transition-colors"
                  >
                    Ver Detalhes
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(t)}
                    className="px-2.5 py-1 text-[11px] bg-primary text-primary-foreground font-mono-data font-bold rounded transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
