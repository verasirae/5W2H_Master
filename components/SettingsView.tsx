'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';

interface SettingsViewProps {
  workspaceConfig: WorkspaceConfig;
  setWorkspaceConfig: React.Dispatch<React.SetStateAction<WorkspaceConfig>>;
  resetToSampleData: () => void;
  clearAllData: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  workspaceConfig,
  setWorkspaceConfig,
  resetToSampleData,
  clearAllData,
  showToast,
}) => {
  const [activeDeptForCat, setActiveDeptForCat] = useState<string>(
    workspaceConfig.departments[0] || 'RH/DP'
  );

  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('success', 'Configurações Salvas', 'As preferências do workspace foram salvas com sucesso.');
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
            Personalize departamentos, categorias de rotina, símbolo de moeda e parâmetros do SLA de prazo.
          </p>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-card border border-border p-4 md:p-5 space-y-4 w-full">
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
              className="w-full bg-background border border-input text-foreground p-2 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
              Departamento Padrão do Usuário:
            </label>
            <select
              value={workspaceConfig.departmentName}
              onChange={(e) =>
                setWorkspaceConfig((prev) => ({ ...prev, departmentName: e.target.value }))
              }
              className="w-full bg-background border border-input text-foreground p-2 focus:border-primary focus:outline-none cursor-pointer"
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
              Símbolo de Moeda (Custo &quot;Quanto&quot;):
            </label>
            <input
              type="text"
              value={workspaceConfig.currencySymbol}
              onChange={(e) =>
                setWorkspaceConfig((prev) => ({ ...prev, currencySymbol: e.target.value }))
              }
              placeholder="R$, $, €..."
              className="w-full bg-background border border-input text-foreground p-2 focus:border-primary focus:outline-none font-mono-data"
            />
          </div>

          <div>
            <label className="text-[11px] font-mono-data text-muted-foreground uppercase block mb-1">
              Dias para Alerta de &quot;Atenção&quot; no Prazo (SLA):
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={workspaceConfig.attentionThresholdDays}
              onChange={(e) =>
                setWorkspaceConfig((prev) => ({
                  ...prev,
                  attentionThresholdDays: Number(e.target.value) || 3,
                }))
              }
              className="w-full bg-background border border-input text-foreground p-2 focus:border-primary focus:outline-none font-mono-data"
            />
            <span className="text-[10px] text-muted-foreground font-mono-data mt-1 block">
              Tarefas com vencimento em até {workspaceConfig.attentionThresholdDays} dias serão marcadas com status &quot;Atenção&quot;.
            </span>
          </div>
        </form>
      </div>

      {/* Departments & Categories Configuration */}
      <div className="bg-card border border-border p-5 space-y-4">
        <h3 className="text-xs font-bold text-foreground font-mono-data uppercase flex items-center gap-2 border-b border-border pb-2">
          <Layers className="w-4 h-4 text-primary" />
          <span>Gestão de Departamentos e Categorias / Rotinas</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Departamentos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-foreground font-mono-data uppercase">
              Departamentos Cadastrados ({workspaceConfig.departments.length})
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Novo Departamento..."
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                className="flex-1 bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddDepartment}
                className="px-3 py-2 bg-primary text-primary-foreground font-bold text-xs uppercase font-mono-data hover:bg-primary/90 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-background border border-border divide-y divide-border max-h-60 overflow-y-auto">
              {workspaceConfig.departments.map((d) => (
                <div
                  key={d}
                  onClick={() => setActiveDeptForCat(d)}
                  className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    activeDeptForCat === d ? 'bg-muted text-primary font-bold' : 'text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span className="truncate">{d}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-mono-data">
                      ({(workspaceConfig.categoriesByDepartment[d] || []).length} rotinas)
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDepartment(d);
                      }}
                      title="Excluir Departamento"
                      className="text-muted-foreground hover:text-destructive p-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                className="flex-1 bg-background border border-input text-foreground text-xs p-2 focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-2 bg-info text-info-foreground font-bold text-xs uppercase font-mono-data hover:bg-info/90 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-background border border-border divide-y divide-border max-h-60 overflow-y-auto">
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
      <div className="bg-card border border-border p-5 space-y-4">
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
              className="px-3 py-2 bg-background border border-border hover:border-primary text-foreground font-bold text-xs uppercase font-mono-data transition-colors cursor-pointer"
            >
              Restaurar Exemplo
            </button>
            <button
              onClick={() => {
                if (confirm('Atenção: Deseja apagar TODAS as tarefas cadastradas? Esta ação não pode ser desfeita.')) {
                  clearAllData();
                }
              }}
              className="px-3 py-2 bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90 font-bold text-xs uppercase font-mono-data transition-colors cursor-pointer"
            >
              Limpar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
