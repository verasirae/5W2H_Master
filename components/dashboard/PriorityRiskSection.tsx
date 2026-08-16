'use client';

import React, { useMemo } from 'react';
import { Task5W2H } from '@/types/5w2h';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Pie,
  PieChart,
  Cell,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ShieldAlert, FileText } from 'lucide-react';

interface PriorityRiskSectionProps {
  tasks: Task5W2H[];
}

const PRIORITY_COLORS: Record<string, string> = {
  Baixa: 'var(--chart-1)',
  Média: 'var(--chart-2)',
  Alta: 'var(--chart-4)',
  Urgente: 'var(--chart-5)',
};

const STATUS_COLORS: Record<string, string> = {
  completed: 'var(--primary)',
  inProgress: 'var(--info)',
  notStarted: 'var(--muted-foreground)',
  overdue: 'var(--destructive)',
  cancelled: 'var(--border)',
};

const crossPriorityConfig = {
  completed: {
    label: 'Concluído',
    color: STATUS_COLORS.completed,
  },
  inProgress: {
    label: 'Em andamento',
    color: STATUS_COLORS.inProgress,
  },
  notStarted: {
    label: 'Não iniciado',
    color: STATUS_COLORS.notStarted,
  },
  overdue: {
    label: 'Atrasado',
    color: STATUS_COLORS.overdue,
  },
  cancelled: {
    label: 'Cancelado',
    color: STATUS_COLORS.cancelled,
  },
} satisfies ChartConfig;

export const PriorityRiskSection: React.FC<PriorityRiskSectionProps> = ({
  tasks,
}) => {
  // 17. Distribuição por Prioridade (Donut)
  const priorityData = useMemo(() => {
    const counts: Record<string, number> = {
      Baixa: 0,
      Média: 0,
      Alta: 0,
      Urgente: 0,
    };

    tasks.forEach((t) => {
      const p = t.priority || 'Média';
      if (counts[p] !== undefined) counts[p] += 1;
      else counts['Média'] += 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        color: PRIORITY_COLORS[name] || 'var(--primary)',
      }))
      .filter((item) => item.value > 0);
  }, [tasks]);

  const priorityChartConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    priorityData.forEach((item) => {
      cfg[item.name] = { label: item.name, color: item.color };
    });
    return cfg satisfies ChartConfig;
  }, [priorityData]);

  // 18. Cruzamento Prioridade × Status (Stacked Bar Chart)
  const crossData = useMemo(() => {
    const priorities = ['Baixa', 'Média', 'Alta', 'Urgente'];
    return priorities.map((p) => {
      const tasksInPriority = tasks.filter(
        (t) => (t.priority || 'Média') === p
      );
      return {
        priority: p,
        completed: tasksInPriority.filter((t) => t.status === 'Concluído').length,
        inProgress: tasksInPriority.filter((t) => t.status === 'Em andamento').length,
        notStarted: tasksInPriority.filter((t) => t.status === 'Não iniciado').length,
        overdue: tasksInPriority.filter((t) => t.status === 'Atrasado').length,
        cancelled: tasksInPriority.filter((t) => t.status === 'Cancelado').length,
      };
    });
  }, [tasks]);

  // 19. % de Tarefas com Observações/Pendências Registradas
  const { notesCount, notesPercent, totalTasks } = useMemo(() => {
    const total = tasks.length;
    const withNotes = tasks.filter(
      (t) => t.observations && t.observations.trim().length > 0
    ).length;
    const pct = total > 0 ? Math.round((withNotes / total) * 100) : 0;
    return {
      notesCount: withNotes,
      notesPercent: pct,
      totalTasks: total,
    };
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2 pt-2">
        <ShieldAlert className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider font-mono-data text-foreground">
          Prioridade e Risco
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 17. Distribuição por Prioridade */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Distribuição por Prioridade
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0 ml-1">
              Gravidade
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[280px] h-[300px] flex flex-col items-center justify-center">
            {priorityData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data text-center">
                Nenhuma tarefa encontrada.
              </div>
            ) : (
              <ChartContainer config={priorityChartConfig} className="h-full w-full">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`prio-cell-${index}`} fill={entry.color} stroke="var(--card)" />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 18. Cruzamento Prioridade × Status */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Cruzamento Prioridade × Status
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0 ml-1">
              Empilhado
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[280px] h-[300px] flex items-center justify-center">
            <ChartContainer config={crossPriorityConfig} className="h-full w-full">
              <BarChart
                accessibilityLayer
                data={crossData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="priority" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="inProgress" stackId="a" fill="var(--color-inProgress)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="notStarted" stackId="a" fill="var(--color-notStarted)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="overdue" stackId="a" fill="var(--color-overdue)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cancelled" stackId="a" fill="var(--color-cancelled)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* 19. % Tarefas com Observações Registradas */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Bloqueios e Impedimentos
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0 ml-1">
              Rastreabilidade
            </span>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-around min-h-[280px] h-[300px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider font-mono-data">
                Taxa de Anotações
              </span>
              <FileText className="w-4 h-4 text-primary" />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono-data text-foreground">
                  {notesPercent}%
                </span>
                <span className="text-xs font-mono-data text-muted-foreground">
                  ({notesCount}/{totalTasks})
                </span>
              </div>

              {/* Progress bar native styled */}
              <div className="w-full bg-muted h-2.5 border border-border">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${Math.min(notesPercent, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground font-mono-data">
              {notesCount > 0
                ? `${notesCount} tarefas possuem notas ou impedimentos descritos.`
                : 'Nenhuma tarefa com pendência ou observação.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
