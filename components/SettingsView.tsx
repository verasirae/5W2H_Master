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
} from 'lucide-react';

interface SettingsViewProps {
  workspaceConfig: WorkspaceConfig;
  setWorkspaceConfig: React.Dispatch<React.SetStateAction<WorkspaceConfig>>;
  resetToSampleData: () => void;
  clearAllData: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  syncTasksToDatabase?: () => Promise<void>;
  dbStatus?: { connected: boolean; checked: boolean; message?: string };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  workspaceConfig,
  setWorkspaceConfig,
  resetToSampleData,
  clearAllData,
  showToast,
  syncTasksToDatabase,
  dbStatus,
}) => {
  const [activeDeptForCat, setActiveDeptForCat] = useState<string>(
    workspaceConfig.departments[0] || 'RH/DP'
  );

  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbHealth, setDbHealth] = useState<{
    status?: string;
    connected?: boolean;
    taskCount?: number;
    message?: string;
    error?: string;
  } | null>(null);

  const checkDbHealth = useCallback(async (isManualTrigger = false) => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/health/db');
      const data = await res.json();
      setDbHealth(data);
      if (isManualTrigger) {
        if (data.connected) {
          showToast('success', 'Supabase Conectado', `Conexão ativa com o banco PostgreSQL via Prisma 7 (${data.taskCount} tarefas).`);
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
  }, [showToast]);

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
    showToast('success', 'Configurações Salvas', 'As preferências do workspace foram salvas com sucesso.');
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workspaceConfig),
      });
    } catch (err) {
      console.warn('Could not persist settings to DB:', err);
    }
  };

  const handleAddDepartment = () => {
    const trimmed = newDepartmentName.trim();
    if (!trimmed) return;

    if (workspaceConfig.departments.includes(trimmed)) {
      showToast('info', 'Departamento Existente', 'Este departamento já está cadastrado.');
      return;
    }

    setWorkspaceConfig((prev) => ({
      ...prev,
      departments: [...prev.departments, trimmed],
      categoriesByDepartment: {
        ...prev.categoriesByDepartment,
        [trimmed]: prev.categoriesByDepartment[trimmed] || ['Geral', 'Processos Internos'],
      },
    }));

    setNewDepartmentName('');
    setActiveDeptForCat(trimmed);
    showToast('success', 'Departamento Adicionado', `O departamento "${trimmed}" foi criado.`);
  };

  const handleDeleteDepartment = (dept: string) => {
    if (workspaceConfig.departments.length <= 1) {
      showToast('error', 'Ação Não Permitida', 'É necessário manter ao menos 1 departamento no workspace.');
      return;
    }

    if (confirm(`Deseja remover o departamento "${dept}" e suas categorias associadas?`)) {
      setWorkspaceConfig((prev) => {
        const nextDeps = prev.departments.filter((d) => d !== dept);
        const nextCats = { ...prev.categoriesByDepartment };
        delete nextCats[dept];

        return {
          ...prev,
          departments: nextDeps,
          categoriesByDepartment: nextCats,
          departmentName: prev.departmentName === dept ? nextDeps[0] : prev.departmentName,
        };
      });

      setActiveDeptForCat(workspaceConfig.departments.find((d) => d !== dept) || '');
      showToast('info', 'Departamento Removido', `O departamento "${dept}" foi removido.`);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    const currentCats = workspaceConfig.categoriesByDepartment[activeDeptForCat] || [];
    if (currentCats.includes(trimmed)) {
      showToast('info', 'Categoria Existente', 'Esta categoria já existe para o departamento selecionado.');
      return;
    }

    setWorkspaceConfig((prev) => ({
      ...prev,
      categoriesByDepartment: {
        ...prev.categoriesByDepartment,
        [activeDeptForCat]: [...currentCats, trimmed],
      },
    }));

    setNewCategoryName('');
    showToast('success', 'Categoria Adicionada', `Nova categoria "${trimmed}" adicionada em ${activeDeptForCat}.`);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const currentCats = workspaceConfig.categoriesByDepartment[activeDeptForCat] || [];
    setWorkspaceConfig((prev) => ({
      ...prev,
      categoriesByDepartment: {
        ...prev.categoriesByDepartment,
        [activeDeptForCat]: currentCats.filter((c) => c !== catToDelete),
      },
    }));

    showToast('info', 'Categoria Removida', `Categoria "${catToDelete}" removida de ${activeDeptForCat}.`);
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
            Personalize departamentos, categorias de rotina, banco de dados Supabase e parâmetros do SLA de prazo.
          </p>
        </div>
      </div>

      {/* Supabase & Prisma ORM v7 Status Card */}
      <div className="bg-card border border-border p-4 md:p-5 rounded-md space-y-3.5">
        <div className="flex items-center justify-between border-b border-border pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground font-mono-data uppercase">
              Banco de Dados Supabase (PostgreSQL + Prisma ORM v7)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {dbHealth?.connected ? (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 rounded-md text-[10px] font-mono-data font-bold uppercase">
                <CheckCircle2 className="w-3 h-3" /> Supabase Conectado
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 rounded-md text-[10px] font-mono-data font-bold uppercase">
                <Server className="w-3 h-3" /> Modo Local / Sem DATABASE_URL
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          O ambiente está totalmente preparado e configurado com o <strong>Prisma ORM 7</strong> utilizando o adapter nativo PostgreSQL (<code>@prisma/adapter-pg</code>) otimizado para o pool de conexões do <strong>Supabase</strong>.
        </p>

        <div className="bg-background border border-border rounded-md p-3 text-[11px] font-mono-data space-y-1.5">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Variáveis de Ambiente Suportadas:</span>
            <span className="text-foreground font-bold">DATABASE_URL & DIRECT_URL</span>
          </div>
          <div className="text-muted-foreground text-[10px]">
            • <code>DATABASE_URL</code>: String de conexão com Transaction Pooler (porta 6543) com <code>?pgbouncer=true</code>
          </div>
          <div className="text-muted-foreground text-[10px]">
            • <code>DIRECT_URL</code>: Conexão direta com a porta 5432 para migrations e prisma push
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
            <span>{isTestingDb ? 'Testando Conexão...' : 'Testar Conexão com Supabase'}</span>
          </button>

          {syncTasksToDatabase && (
            <button
              type="button"
              onClick={syncTasksToDatabase}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-mono-data font-bold text-xs rounded-md transition-colors cursor-pointer shadow-sm"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Sincronizar Tarefas Locais com Supabase</span>
            </button>
          )}
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-card border border-border p-4 md:p-5 space-y-4 w-full rounded-md">
        <h3 className="text-xs font-bold text-foreground font-mono-data uppercase flex items-center gap-2 border-b border-border pb-2">
          <Building className="w-4 h-4 text-info" />
          <span>Parâmetros Gerais do Espaço de Trabalho</span>
        </h3>

        <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-body-md">
          <div>
            <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
              Nome do Espaço de Trabalho:
            </label>
            <input
              type="text"
              value={workspaceConfig.workspaceName}
              onChange={(e) =>
                setWorkspaceConfig((prev) => ({ ...prev, workspaceName: e.target.value }))
              }
              className="w-full bg-background border border-input text-foreground text-xs p-2.5 rounded-md focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
              Departamento Padrão Inicial:
            </label>
            <select
              value={workspaceConfig.departmentName}
              onChange={(e) =>
                setWorkspaceConfig((prev) => ({ ...prev, departmentName: e.target.value }))
              }
              className="w-full bg-background border border-input text-foreground text-xs p-2.5 rounded-md focus:border-primary focus:outline-none cursor-pointer"
            >
              {workspaceConfig.departments.map((d) => (
                <option key={d} value={d} className="bg-popover text-foreground">
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
              Símbolo da Moeda (Orçamentos):
            </label>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={workspaceConfig.currencySymbol}
                onChange={(e) =>
                  setWorkspaceConfig((prev) => ({ ...prev, currencySymbol: e.target.value }))
                }
                className="w-24 bg-background border border-input text-foreground text-xs p-2.5 rounded-md focus:border-primary focus:outline-none font-mono-data"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
              Alerta de Atenção de Prazo (Dias Antes):
            </label>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-warning" />
              <input
                type="number"
                min="1"
                max="30"
                value={workspaceConfig.attentionThresholdDays}
                onChange={(e) =>
                  setWorkspaceConfig((prev) => ({
                    ...prev,
                    attentionThresholdDays: Number(e.target.value) || 3,
                  }))
                }
                className="w-24 bg-background border border-input text-foreground text-xs p-2.5 rounded-md focus:border-primary focus:outline-none font-mono-data"
              />
              <span className="text-[11px] text-muted-foreground">dias antes do vencimento</span>
            </div>
          </div>

          <div className="md:col-span-2 pt-2 border-t border-border flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs uppercase font-mono-data hover:bg-primary/90 transition-colors cursor-pointer rounded-md shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Preferências</span>
            </button>
          </div>
        </form>
      </div>

      {/* Departments and Categories Master Data */}
      <div className="bg-card border border-border p-4 md:p-5 space-y-4 rounded-md">
        <h3 className="text-xs font-bold text-foreground font-mono-data uppercase flex items-center gap-2 border-b border-border pb-2">
          <Layers className="w-4 h-4 text-info" />
          <span>Estrutura Organizacional: Departamentos e Rotinas</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-body-md">
          {/* Departamentos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground font-mono-data uppercase">
              Departamentos Cadastrados ({workspaceConfig.departments.length})
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do Novo Departamento..."
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                className="flex-1 bg-background border border-input text-foreground text-xs p-2 rounded-md focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                className="px-3 py-2 bg-primary text-primary-foreground font-bold text-xs uppercase font-mono-data hover:bg-primary/90 cursor-pointer rounded-md"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-background border border-border divide-y divide-border max-h-60 overflow-y-auto rounded-md">
              {workspaceConfig.departments.map((dept) => (
                <div
                  key={dept}
                  onClick={() => setActiveDeptForCat(dept)}
                  className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    activeDeptForCat === dept
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeDeptForCat === dept ? 'bg-primary' : 'bg-muted-foreground'
                      }`}
                    />
                    {dept}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDepartment(dept);
                    }}
                    title="Excluir Departamento"
                    className="text-muted-foreground hover:text-destructive p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Categorias por Departamento */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground font-mono-data uppercase">
              Rotinas / Categorias de: <span className="text-primary">{activeDeptForCat}</span>
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Nova Categoria para ${activeDeptForCat}...`}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 bg-background border border-input text-foreground text-xs p-2 rounded-md focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-2 bg-info text-info-foreground font-bold text-xs uppercase font-mono-data hover:bg-info/90 cursor-pointer rounded-md"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-background border border-border divide-y divide-border max-h-60 overflow-y-auto rounded-md">
              {(workspaceConfig.categoriesByDepartment[activeDeptForCat] || []).length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-xs font-mono-data">
                  Nenhuma categoria cadastrada neste departamento.
                </div>
              ) : (
                (workspaceConfig.categoriesByDepartment[activeDeptForCat] || []).map((cat) => (
                  <div
                    key={cat}
                    className="p-2.5 flex items-center justify-between text-xs text-foreground hover:bg-muted/50"
                  >
                    <span>{cat}</span>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      title="Excluir Categoria"
                      className="text-muted-foreground hover:text-destructive p-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Management & Resets */}
      <div className="bg-card border border-border p-5 space-y-4 rounded-md">
        <h3 className="text-xs font-bold text-foreground font-mono-data uppercase flex items-center gap-2 border-b border-border pb-2">
          <RotateCcw className="w-4 h-4 text-destructive" />
          <span>Gestão de Dados e Restauração</span>
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="text-xs text-muted-foreground font-body-md">
            <p className="font-bold text-foreground">Restaurar Dados de Exemplo ou Limpar Banco:</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Se desejar redefinir os dados para o estado inicial de demonstração ou limpar todas as tarefas.
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={resetToSampleData}
              className="px-3 py-2 bg-background border border-border hover:border-primary text-foreground font-bold text-xs uppercase font-mono-data transition-colors cursor-pointer rounded-md"
            >
              Restaurar Exemplo
            </button>
            <button
              onClick={() => {
                if (confirm('Atenção: Deseja apagar TODAS as tarefas cadastradas? Esta ação não pode ser desfeita.')) {
                  clearAllData();
                }
              }}
              className="px-3 py-2 bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 font-bold text-xs uppercase font-mono-data transition-colors cursor-pointer rounded-md"
            >
              Limpar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
