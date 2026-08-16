'use client';

import React, { useMemo } from 'react';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import { calculateTaskDeadlineInfo } from '@/lib/5w2h-utils';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Timer, AlertOctagon } from 'lucide-react';

interface ExecutionTimeSectionProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
}

const leadTimeConfig = {
  days: {
    label: 'Lead Time Médio (dias)',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const agingConfig = {
  count: {
    label: 'Tarefas Atrasadas',
    color: 'var(--destructive)',
  },
} satisfies ChartConfig;

const upcomingConfig = {
  tasks: {
    label: 'A Vencer',
    color: 'var(--warning)',
  },
} satisfies ChartConfig;

export const ExecutionTimeSection: React.FC<ExecutionTimeSectionProps> = ({
  tasks,
  workspaceConfig,
}) => {
  // 10. Lead Time Médio (dias) por Categoria
  const leadTimeByCategory = useMemo(() => {
    const map: Record<string, { totalDays: number; count: number }> = {};

    tasks.forEach((t) => {
      if (!t.startDate) return;
      const cat = t.category || 'Geral';
      const end = t.completionDate
        ? new Date(t.completionDate)
        : t.deadlineDate
        ? new Date(t.deadlineDate)
        : new Date();
      const start = new Date(t.startDate);
      const diffDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      );

      if (!map[cat]) map[cat] = { totalDays: 0, count: 0 };
      map[cat].totalDays += diffDays;
      map[cat].count += 1;
    });

    return Object.entries(map)
      .map(([category, item]) => ({
        category,
        days: Math.round((item.totalDays / item.count) * 10) / 10,
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 6);
  }, [tasks]);

  // 11. Aging de Tarefas Atrasadas (faixas de dias) & 12. Tempo Médio de Atraso
  const { agingData, avgDelayDays, totalOverdueCount } = useMemo(() => {
    const buckets = {
      '1–3 dias': 0,
      '4–7 dias': 0,
      '8–15 dias': 0,
      '15+ dias': 0,
    };

    let totalDelayDays = 0;
    let overdueCount = 0;
    const now = new Date().getTime();

    tasks.forEach((t) => {
      if (t.status === 'Concluído' || t.status === 'Cancelado') return;
      const calc = calculateTaskDeadlineInfo(
        t.deadlineDate,
        t.status,
        workspaceConfig.attentionThresholdDays
      );

      if (calc.deadlineSituation === 'Atrasado' && t.deadlineDate) {
        const deadline = new Date(t.deadlineDate).getTime();
        const diffDays = Math.max(
          1,
          Math.floor((now - deadline) / (1000 * 60 * 60 * 24))
        );

        overdueCount += 1;
        totalDelayDays += diffDays;

        if (diffDays <= 3) buckets['1–3 dias'] += 1;
        else if (diffDays <= 7) buckets['4–7 dias'] += 1;
        else if (diffDays <= 15) buckets['8–15 dias'] += 1;
        else buckets['15+ dias'] += 1;
      }
    });

    const agingColors = [
      'var(--chart-4)',
      'var(--warning)',
      'var(--chart-5)',
      'var(--destructive)',
    ];

    const chartList = Object.entries(buckets).map(([range, count], idx) => ({
      range,
      count,
      fill: agingColors[idx],
    }));

    const avg =
      overdueCount > 0 ? (totalDelayDays / overdueCount).toFixed(1) : '0';

    return {
      agingData: chartList,
      avgDelayDays: avg,
      totalOverdueCount: overdueCount,
    };
  }, [tasks, workspaceConfig.attentionThresholdDays]);

  // 13. Próximos Vencimentos (7/15/30 dias)
  const upcomingDeadlinesData = useMemo(() => {
    let next7 = 0;
    let next15 = 0;
    let next30 = 0;

    const now = new Date().getTime();

    tasks.forEach((t) => {
      if (t.status === 'Concluído' || t.status === 'Cancelado' || !t.deadlineDate)
        return;

      const deadline = new Date(t.deadlineDate).getTime();
      const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);

      if (diffDays >= 0) {
        if (diffDays <= 7) next7 += 1;
        else if (diffDays <= 15) next15 += 1;
        else if (diffDays <= 30) next30 += 1;
      }
    });

    return [
      { window: 'Próx. 7 dias', tasks: next7 },
      { window: 'Próx. 15 dias', tasks: next15 },
      { window: 'Próx. 30 dias', tasks: next30 },
    ];
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2 pt-2">
        <Timer className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider font-mono-data text-foreground">
          Tempo de Execução
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 10. Lead Time Médio (dias) por Categoria */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Lead Time Médio
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0 ml-1">
              Dias corridos
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[280px] h-[300px] flex items-center justify-center">
            {leadTimeByCategory.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data text-center">
                Nenhum dado temporal encontrado.
              </div>
            ) : (
              <ChartContainer config={leadTimeConfig} className="h-full w-full">
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  data={leadTimeByCategory}
                  margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={85}
                    tickFormatter={(val) =>
                      val.length > 12 ? `${val.slice(0, 10)}...` : val
                    }
                  />
                  <XAxis type="number" tickLine={false} axisLine={false} unit=" d" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val) => `${val} dias`}
                      />
                    }
                  />
                  <Bar dataKey="days" fill="var(--color-days)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 11. Aging de Tarefas Atrasadas & 12. Tempo Médio de Atraso */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Aging de Atrasos
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0 ml-1">
              Faixas de Dias
            </span>
          </div>

          <div className="p-4 flex-1 flex flex-col gap-3 min-h-[280px] h-[300px]">
            {/* 12. Tempo Médio de Atraso (KPI Compacto) */}
            <div className="bg-muted/40 border border-border px-3 py-2 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-xs text-destructive font-bold uppercase tracking-wider font-mono-data">
                  Média: {avgDelayDays} dias
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono-data">
                {totalOverdueCount} atrasadas
              </span>
            </div>

            {/* Aging Chart */}
            <div className="flex-1 w-full min-h-0">
              <ChartContainer config={agingConfig} className="h-full w-full">
                <BarChart
                  accessibilityLayer
                  data={agingData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {agingData.map((entry, index) => (
                      <Cell key={`aging-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>
        </div>

        {/* 13. Próximos Vencimentos (7/15/30 dias) */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Próximos Vencimentos
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0 ml-1">
              7, 15 e 30 dias
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[280px] h-[300px] flex items-center justify-center">
            <ChartContainer config={upcomingConfig} className="h-full w-full">
              <BarChart
                accessibilityLayer
                data={upcomingDeadlinesData}
                margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="window" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="tasks" fill="var(--color-tasks)" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
