'use client';

import React, { useMemo } from 'react';
import { Task5W2H } from '@/types/5w2h';
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { GitCommit, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

interface FlowTrendSectionProps {
  tasks: Task5W2H[];
}

const funnelConfig = {
  count: {
    label: 'Volume de Tarefas',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const burnupConfig = {
  totalCreated: {
    label: 'Total Criado (Acumulado)',
    color: 'var(--chart-1)',
  },
  totalCompleted: {
    label: 'Total Concluído (Acumulado)',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export const FlowTrendSection: React.FC<FlowTrendSectionProps> = ({ tasks }) => {
  // 20. Funil de Status (Não iniciado -> Em andamento -> Concluído)
  const funnelData = useMemo(() => {
    const notStarted = tasks.filter((t) => t.status === 'Não iniciado').length;
    const inProgress = tasks.filter((t) => t.status === 'Em andamento').length;
    const completed = tasks.filter((t) => t.status === 'Concluído').length;

    return [
      { stage: '1. Não Iniciado', count: notStarted, fill: 'var(--muted-foreground)' },
      { stage: '2. Em Andamento', count: inProgress, fill: 'var(--info)' },
      { stage: '3. Concluído', count: completed, fill: 'var(--primary)' },
    ];
  }, [tasks]);

  // 21. Burn-up: Criadas vs. Concluídas (acumulado por competência)
  const burnupData = useMemo(() => {
    // Collect distinct competences sorted
    const compMap: Record<string, { created: number; completed: number }> = {};

    tasks.forEach((t) => {
      const comp = t.competence || '2025-01';
      if (!compMap[comp]) {
        compMap[comp] = { created: 0, completed: 0 };
      }
      compMap[comp].created += 1;
      if (t.status === 'Concluído') {
        compMap[comp].completed += 1;
      }
    });

    const sortedComps = Object.keys(compMap).sort();
    const result: Array<{
      competence: string;
      totalCreated: number;
      totalCompleted: number;
    }> = [];

    let currentCreated = 0;
    let currentCompleted = 0;

    for (const comp of sortedComps) {
      currentCreated += compMap[comp].created;
      currentCompleted += compMap[comp].completed;
      result.push({
        competence: comp,
        totalCreated: currentCreated,
        totalCompleted: currentCompleted,
      });
    }

    return result;
  }, [tasks]);

  // 22. Comparativo Competência Atual vs. Anterior
  const { currentCompName, currentCompCount, prevCompCount, diffPercent, isPositive } =
    useMemo(() => {
      const compMap: Record<string, number> = {};
      tasks.forEach((t) => {
        const comp = t.competence || 'N/A';
        compMap[comp] = (compMap[comp] || 0) + 1;
      });

      const sortedComps = Object.keys(compMap).sort();
      if (sortedComps.length === 0) {
        return {
          currentCompName: 'N/A',
          currentCompCount: 0,
          prevCompCount: 0,
          diffPercent: 0,
          isPositive: true,
        };
      }

      const current = sortedComps[sortedComps.length - 1];
      const prev =
        sortedComps.length > 1 ? sortedComps[sortedComps.length - 2] : null;

      const cCount = compMap[current] || 0;
      const pCount = prev ? compMap[prev] || 0 : 0;

      let pct = 0;
      if (pCount > 0) {
        pct = Math.round(((cCount - pCount) / pCount) * 100);
      } else if (cCount > 0) {
        pct = 100;
      }

      return {
        currentCompName: current,
        currentCompCount: cCount,
        prevCompCount: pCount,
        diffPercent: Math.abs(pct),
        isPositive: pct >= 0,
      };
    }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2 pt-2">
        <GitCommit className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider font-mono-data text-foreground">
          Fluxo e Tendência
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 20. Funil de Status (Spans 4 cols) */}
        <div className="lg:col-span-4 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Funil de Execução de Status
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Entrada → Saída
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[260px] flex items-center justify-center">
            <ChartContainer config={funnelConfig} className="min-h-[220px] w-full">
              <BarChart
                accessibilityLayer
                layout="vertical"
                data={funnelData}
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* 21. Burn-up: Criadas vs. Concluídas (Spans 5 cols) */}
        <div className="lg:col-span-5 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Burn-Up Acumulado (Criadas vs Concluídas)
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Progresso do Escopo
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[260px] flex items-center justify-center">
            {burnupData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Nenhum dado temporal.
              </div>
            ) : (
              <ChartContainer config={burnupConfig} className="min-h-[220px] w-full">
                <AreaChart
                  accessibilityLayer
                  data={burnupData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="competence" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type="monotone"
                    dataKey="totalCreated"
                    stroke="var(--color-totalCreated)"
                    fill="var(--color-totalCreated)"
                    fillOpacity={0.15}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalCompleted"
                    stroke="var(--color-totalCompleted)"
                    fill="var(--color-totalCompleted)"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 22. Comparativo Competência Atual vs Anterior (Spans 3 cols) */}
        <div className="lg:col-span-3 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Competência vs. Anterior
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Variação MoM
            </span>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-around min-h-[260px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider font-mono-data">
                {currentCompName}
              </span>
              <ArrowRightLeft className="w-4 h-4 text-primary" />
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-bold font-mono-data text-foreground">
                {currentCompCount}{' '}
                <span className="text-xs font-normal text-muted-foreground">tarefas</span>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                )}
                <span
                  className={`text-xs font-bold font-mono-data ${
                    isPositive ? 'text-primary' : 'text-destructive'
                  }`}
                >
                  {isPositive ? '+' : '-'}
                  {diffPercent}%
                </span>
                <span className="text-[10px] text-muted-foreground font-mono-data">
                  vs mês anterior ({prevCompCount})
                </span>
              </div>
            </div>

            <div className="text-[10px] text-muted-foreground font-mono-data border-t border-border pt-2">
              Ritmo de planejamento ativo para a competência de referência.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
