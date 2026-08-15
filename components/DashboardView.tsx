'use client';

import React, { useMemo } from 'react';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import { calculateTaskDeadlineInfo, formatCurrency } from '@/lib/5w2h-utils';
import { CompetenceBarChart } from '@/components/CompetenceBarChart';
import { ProductivitySection } from '@/components/dashboard/ProductivitySection';
import { FinancialSection } from '@/components/dashboard/FinancialSection';
import { ExecutionTimeSection } from '@/components/dashboard/ExecutionTimeSection';
import { DepartmentComparisonSection } from '@/components/dashboard/DepartmentComparisonSection';
import { PriorityRiskSection } from '@/components/dashboard/PriorityRiskSection';
import { FlowTrendSection } from '@/components/dashboard/FlowTrendSection';
import { QualityRecurrenceSection } from '@/components/dashboard/QualityRecurrenceSection';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Gauge,
  TrendingUp,
} from 'lucide-react';

interface DashboardViewProps {
  tasks: Task5W2H[];
  filteredTasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
  openCreateModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  filteredTasks,
  workspaceConfig,
}) => {
  // KPI Calculations
  const totalTasks = filteredTasks.length;

  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Concluído').length,
    [filteredTasks]
  );

  const inProgressTasks = useMemo(
    () => filteredTasks.filter((t) => t.status === 'Em andamento').length,
    [filteredTasks]
  );

  const overdueTasks = useMemo(() => {
    return filteredTasks.filter((t) => {
      const calc = calculateTaskDeadlineInfo(t.deadlineDate, t.status, workspaceConfig.attentionThresholdDays);
      return calc.deadlineSituation === 'Atrasado';
    }).length;
  }, [filteredTasks, workspaceConfig.attentionThresholdDays]);

  const avgCompletionPercent = useMemo(() => {
    if (totalTasks === 0) return 0;
    const sum = filteredTasks.reduce((acc, t) => acc + (t.progressPercent || 0), 0);
    return Math.round(sum / totalTasks);
  }, [filteredTasks, totalTasks]);

  const totalBudget = useMemo(() => {
    return filteredTasks.reduce((acc, t) => acc + (t.howMuch || 0), 0);
  }, [filteredTasks]);

  // Chart 1: Evolution by Competence
  const competenceData = useMemo(() => {
    const map: Record<string, { competence: string; total: number; completed: number }> = {};
    filteredTasks.forEach((t) => {
      const comp = t.competence || 'N/A';
      if (!map[comp]) {
        map[comp] = { competence: comp, total: 0, completed: 0 };
      }
      map[comp].total += 1;
      if (t.status === 'Concluído') {
        map[comp].completed += 1;
      }
    });
    return Object.values(map).sort((a, b) => a.competence.localeCompare(b.competence));
  }, [filteredTasks]);

  // Chart 2: Status Distribution
  const statusDistributionData = useMemo(() => {
    const counts: Record<string, number> = {
      'Concluído': 0,
      'Em andamento': 0,
      'Não iniciado': 0,
      'Atrasado': 0,
      'Cancelado': 0,
    };
    filteredTasks.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status] += 1;
      } else {
        counts[t.status] = 1;
      }
    });

    const COLORS: Record<string, string> = {
      'Concluído': 'var(--primary)',
      'Em andamento': 'var(--info)',
      'Não iniciado': 'var(--muted-foreground)',
      'Atrasado': 'var(--destructive)',
      'Cancelado': 'var(--border)',
    };

    return Object.keys(counts)
      .map((key) => ({
        name: key,
        value: counts[key],
        color: COLORS[key] || 'var(--muted-foreground)',
      }))
      .filter((item) => item.value > 0);
  }, [filteredTasks]);

  // Chart 3: Tasks by Category/Routine
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTasks.forEach((t) => {
      const cat = t.category || 'Geral';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.keys(map)
      .map((cat) => ({ category: cat, total: map[cat] }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filteredTasks]);

  // Chart 4: Deadline Status Distribution
  const deadlineStatusData = useMemo(() => {
    let onTrack = 0;
    let attention = 0;
    let overdue = 0;
    let done = 0;

    filteredTasks.forEach((t) => {
      const calc = calculateTaskDeadlineInfo(t.deadlineDate, t.status, workspaceConfig.attentionThresholdDays);
      if (calc.deadlineSituation === 'Concluído') done += 1;
      else if (calc.deadlineSituation === 'Atrasado') overdue += 1;
      else if (calc.deadlineSituation === 'Atenção') attention += 1;
      else onTrack += 1;
    });

    const total = filteredTasks.length || 1;

    return [
      { name: 'No Prazo', count: onTrack, percent: Math.round((onTrack / total) * 100), color: 'var(--primary)' },
      { name: 'Atenção', count: attention, percent: Math.round((attention / total) * 100), color: 'var(--info)' },
      { name: 'Atrasado', count: overdue, percent: Math.round((overdue / total) * 100), color: 'var(--destructive)' },
      { name: 'Concluído', count: done, percent: Math.round((done / total) * 100), color: 'var(--muted-foreground)' },
    ];
  }, [filteredTasks, workspaceConfig.attentionThresholdDays]);

  return (
    <div className="flex-1 pl-2 pr-4 md:py-4 space-y-6 overflow-y-auto">
      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <div className="bg-card border border-border p-4 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider font-mono-data">
              Total de Tarefas
            </span>
            <List className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold font-mono-data text-foreground">
            {totalTasks.toLocaleString('pt-BR')}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono-data">
            Orçamento: {formatCurrency(totalBudget, workspaceConfig.currencySymbol)}
          </div>
        </div>

        {/* Completed */}
        <div className="bg-card border border-border p-4 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider font-mono-data">
              Concluídas
            </span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono-data text-foreground">
              {completedTasks}
            </span>
            {totalTasks > 0 && (
              <span className="text-xs font-mono-data text-primary font-bold">
                {Math.round((completedTasks / totalTasks) * 100)}%
              </span>
            )}
          </div>
          <div className="text-[10px] text-primary font-mono-data flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" /> Metas alcançadas
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-card border border-border p-4 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider font-mono-data">
              Em Andamento
            </span>
            <Clock className="w-4 h-4 text-info" />
          </div>
          <div className="text-3xl font-bold font-mono-data text-foreground">
            {inProgressTasks}
          </div>
          <div className="text-[10px] text-info font-mono-data font-medium">
            Em execução ativa
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-card border border-destructive p-4 flex flex-col justify-between h-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-destructive/10 pointer-events-none"></div>
          <div className="flex justify-between items-start relative z-10">
            <span className="text-[10px] text-destructive font-bold uppercase tracking-wider font-mono-data">
              Atrasadas
            </span>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-3xl font-bold font-mono-data text-destructive relative z-10">
            {overdueTasks}
          </div>
          <div className="text-[10px] text-destructive font-mono-data relative z-10 font-medium">
            Requer atenção imediata
          </div>
        </div>

        {/* Avg Completion */}
        <div className="bg-card border border-border p-4 flex flex-col justify-between h-28">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider font-mono-data">
              % Média Conclusão
            </span>
            <Gauge className="w-4 h-4 text-primary" />
          </div>
          <div className="text-3xl font-bold font-mono-data text-primary">
            {avgCompletionPercent}%
          </div>
          {/* Progress bar line */}
          <div className="w-full bg-muted h-1.5 border border-border">
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${Math.min(avgCompletionPercent, 100)}%` }}
            ></div>
          </div>
        </div>
      </section>

      {/* Main Charts Grid (Bento Layout) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Evolution by Competence (Spans 8 cols) */}
        <div className="lg:col-span-8 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Evolução por Competência (Mês a Mês)
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Total vs Concluídas
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[260px] flex items-center">
            <CompetenceBarChart data={competenceData} className="min-h-[240px] w-full" />
          </div>
        </div>

        {/* Chart 2: Status Distribution Donut (Spans 4 cols) */}
        <div className="lg:col-span-4 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Distribuição por Status
            </h3>
          </div>
          <div className="p-4 flex-1 flex flex-col items-center justify-center min-h-[260px]">
            {statusDistributionData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">Sem tarefas no filtro.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={statusDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--card)" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--foreground)', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full flex flex-wrap justify-center gap-2 mt-2">
                  {statusDistributionData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-[11px] font-mono-data text-muted-foreground">
                      <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart 3: Tasks by Category (Spans 6 cols) */}
        <div className="lg:col-span-6 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Tarefas por Categoria / Rotina
            </h3>
          </div>
          <div className="p-4 flex-1 space-y-3 min-h-[200px]">
            {categoryData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data py-8 text-center">Nenhum registro encontrado.</div>
            ) : (
              categoryData.map((item) => {
                const max = categoryData[0]?.total || 1;
                const pct = Math.round((item.total / max) * 100);
                return (
                  <div key={item.category} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono-data text-muted-foreground">
                      <span className="truncate max-w-[240px]">{item.category}</span>
                      <span className="font-bold text-foreground">{item.total}</span>
                    </div>
                    <div className="w-full bg-muted h-2">
                      <div className="bg-primary h-2" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart 4: Deadline Status (Spans 6 cols) */}
        <div className="lg:col-span-6 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Situação do Prazo (SLA)
            </h3>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-around gap-3 min-h-[200px]">
            {deadlineStatusData.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="w-20 font-mono-data text-xs text-muted-foreground text-right truncate">
                  {item.name}
                </div>
                <div className="flex-1 h-6 bg-muted relative">
                  <div
                    className="absolute left-0 top-0 bottom-0 transition-all duration-300"
                    style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                  ></div>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono-data text-[11px] text-foreground font-bold">
                    {item.count} ({item.percent}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1. Seção: Produtividade e Responsáveis */}
      <ProductivitySection
        tasks={filteredTasks}
        workspaceConfig={workspaceConfig}
      />

      {/* 2. Seção: Financeiro (Quanto) */}
      <FinancialSection
        tasks={filteredTasks}
        workspaceConfig={workspaceConfig}
      />

      {/* 3. Seção: Tempo de Execução */}
      <ExecutionTimeSection
        tasks={filteredTasks}
        workspaceConfig={workspaceConfig}
      />

      {/* 4. Seção: Comparativo entre Departamentos */}
      <DepartmentComparisonSection
        tasks={filteredTasks}
        workspaceConfig={workspaceConfig}
      />

      {/* 5. Seção: Prioridade e Risco */}
      <PriorityRiskSection tasks={filteredTasks} />

      {/* 6. Seção: Fluxo e Tendência */}
      <FlowTrendSection tasks={filteredTasks} />

      {/* 7. Seção: Qualidade e Recorrência */}
      <QualityRecurrenceSection
        tasks={filteredTasks}
        workspaceConfig={workspaceConfig}
      />
    </div>
  );
};
