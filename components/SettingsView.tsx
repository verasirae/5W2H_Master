'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WorkspaceConfig } from '@/types/5w2h';
import {
  Settings,
  Building,
  Plus,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Save,
  Clock,
  DollarSign,
  Layers,
  Database,
  CheckCircle2,
  RefreshCw,
  Server,
  Copy,
  Check,
  Code,
  ShieldCheck,
  ExternalLink,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface SettingsViewProps {
  workspaceConfig: WorkspaceConfig;
  setWorkspaceConfig: React.Dispatch<React.SetStateAction<WorkspaceConfig>>;
  resetToSampleData?: () => void;
  clearAllData: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  syncTasksToDatabase?: () => Promise<void>;
  dbStatus?: { connected: boolean; checked: boolean; message?: string };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  workspaceConfig,
  setWorkspaceConfig,
  clearAllData,
  showToast,
  syncTasksToDatabase,
  dbStatus,
}) => {
  const { user, getUserDisplayName, getUserInitials, signOut } = useAuth();
  const [activeDeptForCat, setActiveDeptForCat] = useState<string>(
    workspaceConfig.departments[0] || 'RH/DP'
  );

  const [departmentsList, setDepartmentsList] = useState<Array<{ id?: string; name: string; description?: string; color?: string }>>([]);
  const [categoriesList, setCategoriesList] = useState<Array<{ id?: string; name: string; departmentName: string }>>([]);

  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [sqlContent, setSqlContent] = useState<string>('');
  const [dbHealth, setDbHealth] = useState<{
    status?: string;
    connected?: boolean;
    taskCount?: number;
    message?: string;
    error?: string;
  } | null>(null);

  // Fetch real departments and categories from DB
  const fetchDbDepartmentsAndCategories = useCallback(async () => {
    try {
      const [deptRes, catRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/categories'),
      ]);

      if (deptRes.ok) {
        const deptData = await deptRes.json();
        if (Array.isArray(deptData.departments) && deptData.departments.length > 0) {
          setDepartmentsList(deptData.departments);
          const deptNames = deptData.departments.map((d: any) => d.name);
          setWorkspaceConfig((prev) => ({
            ...prev,
            departments: deptNames,
            departmentName: deptNames.includes(prev.departmentName) ? prev.departmentName : deptNames[0],
          }));
        }
      }

      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData.categories)) {
          setCategoriesList(catData.categories);
        }
      }
    } catch (e) {
      console.warn('Could not load DB departments/categories:', e);
    }
  }, [setWorkspaceConfig]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDbDepartmentsAndCategories();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDbDepartmentsAndCategories]);

  const handleCopySql = async () => {
    try {
      let content = sqlContent;
      if (!content) {
        const res = await fetch('/api/database/migrate');
        const data = await res.json();
        content = data.sql || '';
        setSqlContent(content);
      }
      await navigator.clipboard.writeText(content);
      setCopiedSql(true);
      showToast('success', 'Script SQL Copiado!', 'Script DDL completo copiado para a área de transferência.');
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e: any) {
      showToast('error', 'Falha ao copiar', 'Não foi possível copiar o script para a área de transferência.');
    }
  };

  const handleRunMigration = async () => {
    setIsMigrating(true);
    try {
      const res = await fetch('/api/database/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Migração Concluída', data.message || 'Tabelas criadas com sucesso no PostgreSQL Local.');
        checkDbHealth(false);
        fetchDbDepartmentsAndCategories();
      } else {
        showToast('info', 'Execução de Migração', data.message || data.error || 'Copie o script SQL e execute no PostgreSQL.');
      }
    } catch (err: any) {
      showToast('error', 'Erro na Migração', err.message || 'Falha ao conectar com o endpoint de migração.');
    } finally {
      setIsMigrating(false);
    }
  };

  const checkDbHealth = async (isManualTrigger = false) => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/health/db');
      const data = await res.json();
      setDbHealth(data);
      if (isManualTrigger) {
        if (data.connected) {
          showToast('success', 'PostgreSQL Conectado', `Conexão ativa com o banco PostgreSQL Local via Prisma (${data.taskCount} tarefas).`);
        } else {
          showToast('info', 'Banco de Dados', data.message || 'DATABASE_URL ainda não configurada no ambiente.');
        }
      }
    } catch (e: any) {
      setDbHealth({ connected: false, error: e.message });
      if (isManualTrigger) {
        showToast('error', 'Erro de Conexão', 'Não foi possível contatar o servidor de banco de dados.');
      }
    } finally {
      setIsTestingDb(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/health/db')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) setDbHealth(data);
      })
      .catch((e) => {
        if (isMounted) setDbHealth({ connected: false, error: e.message });
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGeneral(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceConfig),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Configurações Salvas', 'As preferências do workspace foram salvas no banco de dados local com sucesso.');
      } else {
        showToast('info', 'Configurações Salvas Localmente', 'Preferências salvas no navegador.');
      }
    } catch (err: any) {
      showToast('error', 'Erro ao salvar', err.message);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleAddDepartment = async () => {
    const trimmed = newDepartmentName.trim();
    if (!trimmed) return;

    if (workspaceConfig.departments.includes(trimmed)) {
      showToast('info', 'Departamento Existente', 'Este departamento já está cadastrado.');
      return;
    }

    // Update local state immediately
    const updatedDepartments = [...workspaceConfig.departments, trimmed];
    const updatedCategories = {
      ...workspaceConfig.categoriesByDepartment,
      [trimmed]: workspaceConfig.categoriesByDepartment[trimmed] || ['Geral', 'Processos Internos'],
    };

    setWorkspaceConfig((prev) => ({
      ...prev,
      departments: updatedDepartments,
      categoriesByDepartment: updatedCategories,
    }));

    setNewDepartmentName('');
    setActiveDeptForCat(trimmed);

    // Save to PostgreSQL database
    try {
      await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      showToast('success', 'Departamento Salvo', `O departamento "${trimmed}" foi salvo no banco de dados.`);
      fetchDbDepartmentsAndCategories();
    } catch (e) {
      console.warn('Error saving department to DB:', e);
    }
  };

  const handleDeleteDepartment = async (dept: string) => {
    if (workspaceConfig.departments.length <= 1) {
      showToast('error', 'Ação Não Permitida', 'É necessário manter ao menos 1 departamento no workspace.');
      return;
    }

    if (confirm(`Deseja remover o departamento "${dept}" e suas categorias associadas do banco de dados?`)) {
      const nextDeps = workspaceConfig.departments.filter((d) => d !== dept);
      const nextCats = { ...workspaceConfig.categoriesByDepartment };
      delete nextCats[dept];

      setWorkspaceConfig((prev) => ({
        ...prev,
        departments: nextDeps,
        categoriesByDepartment: nextCats,
        departmentName: prev.departmentName === dept ? nextDeps[0] : prev.departmentName,
      }));

      setActiveDeptForCat(nextDeps[0] || '');

      // Delete from DB
      const targetDbDept = departmentsList.find((d) => d.name === dept);
      if (targetDbDept?.id) {
        try {
          await fetch(`/api/departments/${targetDbDept.id}`, { method: 'DELETE' });
        } catch (e) {
          console.warn('Error deleting department from DB:', e);
        }
      }
      showToast('info', 'Departamento Removido', `O departamento "${dept}" foi removido do banco.`);
      fetchDbDepartmentsAndCategories();
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const currentCats = workspaceConfig.categoriesByDepartment[activeDeptForCat] || [];
    if (currentCats.includes(trimmed)) {
      showToast('info', 'Categoria Existente', 'Esta categoria já existe para o departamento selecionado.');
      return;
    }

    const updatedCategories = {
      ...workspaceConfig.categoriesByDepartment,
      [activeDeptForCat]: [...currentCats, trimmed],
    };

    setWorkspaceConfig((prev) => ({
      ...prev,
      categoriesByDepartment: updatedCategories,
    }));

    setNewCategoryName('');

    // Save category to DB
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmed,
          departmentName: activeDeptForCat,
        }),
      });
      showToast('success', 'Categoria Salva', `Nova rotina "${trimmed}" salva no banco de dados.`);
      fetchDbDepartmentsAndCategories();
    } catch (e) {
      console.warn('Error saving category to DB:', e);
    }
  };

  const handleDeleteCategory = async (catToDelete: string) => {
    const currentCats = workspaceConfig.categoriesByDepartment[activeDeptForCat] || [];
    const updatedCategories = {
      ...workspaceConfig.categoriesByDepartment,
      [activeDeptForCat]: currentCats.filter((c) => c !== catToDelete),
    };

    setWorkspaceConfig((prev) => ({
      ...prev,
      categoriesByDepartment: updatedCategories,
    }));

    // Delete category from DB
    const targetDbCat = categoriesList.find((c) => c.name === catToDelete && c.departmentName === activeDeptForCat);
    if (targetDbCat?.id) {
      try {
        await fetch(`/api/categories/${targetDbCat.id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Error deleting category from DB:', e);
      }
    }

    showToast('info', 'Categoria Removida', `Categoria "${catToDelete}" removida do banco.`);
    fetchDbDepartmentsAndCategories();
  };

  return (
    <div className="flex-1 pl-2 pr-4 md:py-4 flex flex-col space-y-4 overflow-y-auto w-full bg-background">
      {/* Title */}
      <div className="flex items-center gap-3 border-b border-border pb-3 shrink-0">
        <Settings className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-base md:text-lg font-bold text-foreground uppercase tracking-tight font-mono-data">
            Configurações do Workspace 5W2H
          </h2>
          <p className="text-[11px] text-muted-foreground font-body-md mt-0.5">
            Personalize departamentos, categorias de rotina, banco de dados PostgreSQL Local e parâmetros do SLA de prazo.
          </p>
        </div>
      </div>

      {/* User Session & Account Card */}
      <div className="bg-card border border-border p-4 md:p-5 rounded-md space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground font-mono-data uppercase">
              Sessão do Usuário & Autenticação
            </h3>
          </div>
          <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-md text-[10px] font-mono-data font-bold uppercase">
            {user ? 'Sessão Ativa' : 'Convidado'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-background border-2 border-primary flex items-center justify-center font-bold text-primary text-base shrink-0 shadow-inner">
              {getUserInitials()}
            </div>
            <div className="space-y-0.5">
              <p className="font-bold text-sm text-foreground">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-muted-foreground font-mono-data">
                {user?.email || 'iraeveras@outlook.com.br'}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] bg-muted px-2 py-0.5 text-foreground uppercase font-mono-data font-semibold">
                  Perfil: {user?.role || 'admin'}
                </span>
                {user?.department && (
                  <span className="text-[10px] bg-muted px-2 py-0.5 text-muted-foreground uppercase font-mono-data">
                    Depto: {user.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            id="btn-settings-logout"
            onClick={async () => {
              await signOut();
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive hover:text-destructive-foreground font-mono-data font-bold text-xs uppercase rounded-md transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Encerrar sessão atual e voltar para a tela de login"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta (Logout)</span>
          </button>
        </div>
      </div>

      {/* PostgreSQL Local & Prisma ORM Status Card */}
      <div className="bg-card border border-border p-4 md:p-5 rounded-md space-y-3.5">
        <div className="flex items-center justify-between border-b border-border pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground font-mono-data uppercase">
              Banco de Dados PostgreSQL Local (Prisma ORM)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {dbHealth?.connected ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 rounded-md text-[10px] font-mono-data font-bold uppercase">
                <CheckCircle2 className="w-3 h-3" /> PostgreSQL Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 rounded-md text-[10px] font-mono-data font-bold uppercase">
                <Server className="w-3 h-3" /> Modo Local / Sem DATABASE_URL
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          O ambiente está conectado ao seu <strong>PostgreSQL Local</strong> (banco <code>5w2h</code>) utilizando <strong>Prisma ORM</strong> com suporte completo a autenticação local com criptografia de senhas e sincronização em tempo real.
        </p>

        <div className="bg-background border border-border rounded-md p-3 text-[11px] font-mono-data space-y-1.5">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Configuração do Banco Local:</span>
            <span className="text-foreground font-bold">5w2h (PostgreSQL 5432)</span>
          </div>
          <div className="text-muted-foreground text-[10px]">
            • <code>DATABASE_URL</code>: <code>postgresql://postgres:db_postgre_root@localhost:5432/5w2h?schema=public</code>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => checkDbHealth(true)}
            disabled={isTestingDb}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border hover:border-primary text-foreground font-mono-data text-xs rounded-md transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin text-primary' : ''}`} />
            <span>{isTestingDb ? 'Testando Conexão...' : 'Testar Conexão com PostgreSQL'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunMigration}
            disabled={isMigrating}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-mono-data font-bold text-xs rounded-md shadow-xs hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
            <span>{isMigrating ? 'Executando Migração...' : 'Criar Tabelas / Migrar Banco'}</span>
          </button>

          {syncTasksToDatabase && (
            <button
              type="button"
              onClick={syncTasksToDatabase}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border hover:border-primary text-foreground font-mono-data text-xs rounded-md transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-primary" />
              <span>Sincronizar Tarefas com Banco</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground border border-border hover:bg-muted/80 font-mono-data text-xs rounded-md transition-colors cursor-pointer"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Script Copiado!' : 'Copiar Script SQL Completo (DDL)'}</span>
          </button>
        </div>
      </div>

      {/* General Settings Form */}
      <form onSubmit={handleSaveGeneral} className="bg-card border border-border p-4 md:p-5 rounded-md space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground font-mono-data uppercase">
              Parâmetros Gerais do Espaço de Trabalho
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-data">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground uppercase">
              Nome da Empresa / Workspace
            </label>
            <input
              type="text"
              value={workspaceConfig.workspaceName}
              onChange={(e) =>
                setWorkspaceConfig((prev) => ({ ...prev, workspaceName: e.target.value }))
              }
              className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
              placeholder="Ex: 5W2H Master - Control Center"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground uppercase">
              Departamento Padrão Selecionado
            </label>
            <select
              value={workspaceConfig.departmentName}
              onChange={(e) =>
                setWorkspaceConfig((prev) => ({ ...prev, departmentName: e.target.value }))
              }
              className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
            >
              {workspaceConfig.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground uppercase flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              <span>Símbolo Monetário (Custo / How Much)</span>
            </label>
            <input
              type="text"
              value={workspaceConfig.currencySymbol}
              onChange={(e) =>
                setWorkspaceConfig((prev) => ({ ...prev, currencySymbol: e.target.value }))
              }
              className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
              placeholder="R$, $, €..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Gatilho de Atenção do SLA (Dias antes do prazo)</span>
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={workspaceConfig.attentionThresholdDays}
              onChange={(e) =>
                setWorkspaceConfig((prev) => ({
                  ...prev,
                  attentionThresholdDays: Math.max(1, parseInt(e.target.value) || 3),
                }))
              }
              className="w-full bg-background border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingGeneral}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold font-mono-data text-xs uppercase rounded shadow-xs hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSavingGeneral ? 'Salvando...' : 'Salvar Preferências'}</span>
          </button>
        </div>
      </form>

      {/* Departments & Categories Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Departments Column */}
        <div className="bg-card border border-border p-4 rounded-md space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground font-mono-data uppercase">
                Departamentos ({workspaceConfig.departments.length})
              </h3>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="Novo Departamento..."
              className="flex-1 bg-background border border-border text-foreground px-3 py-1.5 rounded focus:outline-none focus:border-primary text-xs font-mono-data"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDepartment();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddDepartment}
              className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs uppercase font-mono-data rounded hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {workspaceConfig.departments.map((dept) => {
              const isSelected = activeDeptForCat === dept;
              return (
                <div
                  key={dept}
                  onClick={() => setActiveDeptForCat(dept)}
                  className={`flex items-center justify-between p-2.5 rounded border text-xs font-mono-data cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-accent border-primary text-foreground font-bold shadow-xs'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="truncate">{dept}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {(workspaceConfig.categoriesByDepartment[dept] || []).length} rotinas
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDepartment(dept);
                      }}
                      className="text-muted-foreground hover:text-destructive p-1 rounded"
                      title="Excluir Departamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories / Rotinas Column */}
        <div className="bg-card border border-border p-4 rounded-md space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground font-mono-data uppercase truncate">
                Rotinas de: <span className="text-primary">{activeDeptForCat}</span>
              </h3>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={`Nova rotina para ${activeDeptForCat}...`}
              className="flex-1 bg-background border border-border text-foreground px-3 py-1.5 rounded focus:outline-none focus:border-primary text-xs font-mono-data"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs uppercase font-mono-data rounded hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {(workspaceConfig.categoriesByDepartment[activeDeptForCat] || []).length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-xs font-mono-data">
                Nenhuma rotina cadastrada para este departamento.
              </div>
            ) : (
              (workspaceConfig.categoriesByDepartment[activeDeptForCat] || []).map((cat) => (
                <div
                  key={cat}
                  className="flex items-center justify-between p-2.5 rounded border border-border bg-background text-foreground text-xs font-mono-data"
                >
                  <span>{cat}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded"
                    title="Excluir Rotina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-md space-y-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <h3 className="text-xs font-bold font-mono-data uppercase">Zona de Manutenção de Dados</h3>
        </div>

        <p className="text-xs text-muted-foreground">
          Limpe as tarefas cadastradas na memória da aplicação e no banco de dados quando necessário.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (confirm('Tem certeza que deseja apagar todas as tarefas? Esta ação é irreversível.')) {
                clearAllData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground font-mono-data text-xs rounded transition-colors cursor-pointer font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Todas as Tarefas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
