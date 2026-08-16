'use client';

import React, { useMemo } from 'react';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import { calculateTaskDeadlineInfo } from '@/lib/5w2h-utils';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Users } from 'lucide-react';

interface ProductivitySectionProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
}

const rankingConfig = {
  completed: {
    label: 'Tarefas Concluídas',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const workloadConfig = {
  inProgress: {
    label: 'Em Andamento',
    color: 'var(--info)',
  },
  notStarted: {
    label: 'Não Iniciado',
    color: 'var(--muted-foreground)',
  },
} satisfies ChartConfig;

const overdueConfig = {
  overdue: {
    label: 'Tarefas Atrasadas',
    color: 'var(--destructive)',
  },
} satisfies ChartConfig;

const onTimeRateConfig = {
  rate: {
    label: 'Taxa no Prazo (%)',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export const ProductivitySection: React.FC<ProductivitySectionProps> = ({
  tasks,
  workspaceConfig,
}) => {
  // Aggregate data by assignee (who)
  const assigneeStats = useMemo(() => {
    const map: Record<
      string,
      {
        who: string;
        total: number;
        completed: number;
        inProgress: number;
        notStarted: number;
        overdue: number;
        onTimeCompleted: number;
      }
    > = {};

    tasks.forEach((t) => {
      const who = t.who?.trim() || 'Não atribuído';
      if (!map[who]) {
        map[who] = {
          who,
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          overdue: 0,
          onTimeCompleted: 0,
        };
      }

      map[who].total += 1;
      if (t.status === 'Concluído') {
        map[who].completed += 1;
        // Check if completed on time
        if (t.completionDate && t.deadlineDate) {
          if (new Date(t.completionDate) <= new Date(t.deadlineDate)) {
            map[who].onTimeCompleted += 1;
          }
        } else {
          map[who].onTimeCompleted += 1;
        }
      } else if (t.status === 'Em andamento') {
        map[who].inProgress += 1;
      } else if (t.status === 'Não iniciado') {
        map[who].notStarted += 1;
      }

      const calc = calculateTaskDeadlineInfo(
        t.deadlineDate,
        t.status,
        workspaceConfig.attentionThresholdDays
      );
      if (calc.deadlineSituation === 'Atrasado') {
        map[who].overdue += 1;
      }
    });

    return Object.values(map);
  }, [tasks, workspaceConfig.attentionThresholdDays]);

  // 1. Ranking de Responsáveis (tarefas concluídas)
  const rankingData = useMemo(() => {
    return [...assigneeStats]
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 6);
  }, [assigneeStats]);

  // 2. Carga de Trabalho Atual (Em andamento + Não iniciado)
  const workloadData = useMemo(() => {
    return [...assigneeStats]
      .map((item) => ({
        who: item.who,
        inProgress: item.inProgress,
        notStarted: item.notStarted,
        totalActive: item.inProgress + item.notStarted,
      }))
      .filter((item) => item.totalActive > 0)
      .sort((a, b) => b.totalActive - a.totalActive)
      .slice(0, 6);
  }, [assigneeStats]);

  // 3. Top 5 com Mais Atrasos
  const topOverdueData = useMemo(() => {
    return [...assigneeStats]
      .filter((item) => item.overdue > 0)
      .sort((a, b) => b.overdue - a.overdue)
      .slice(0, 5);
  }, [assigneeStats]);

  // 4. Taxa de Conclusão no Prazo por Responsável (%)
  const onTimeRateData = useMemo(() => {
    return [...assigneeStats]
      .filter((item) => item.total > 0)
      .map((item) => {
        const onTimePct =
          item.total > 0
            ? Math.round(
                ((item.total - item.overdue) / item.total) * 100
              )
            : 0;
        return {
          who: item.who,
          rate: Math.max(0, Math.min(100, onTimePct)),
        };
      })
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 6);
  }, [assigneeStats]);

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2 pt-2">
        <Users className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider font-mono-data text-foreground">
          Produtividade e Responsáveis
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* 1. Ranking de Responsáveis (Concluídas) */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Ranking de Responsáveis
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0 ml-1">
              Concluídas
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[280px] h-[300px] flex items-center justify-center">
            {rankingData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data text-center">
                Nenhum dado encontrado.
              </div>
            ) : (
              <ChartContainer config={rankingConfig} className="h-full w-full">
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  data={rankingData}
                  margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis
                    dataKey="who"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={85}
                    tickFormatter={(val) =>
                      val.length > 12 ? `${val.slice(0, 10)}...` : val
                    }
                  />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="completed" fill="var(--color-completed)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 2. Carga de Trabalho Atual por Responsável */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Carga de Trabalho Atual
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0 ml-1">
              Ativas
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[280px] h-[300px] flex items-center justify-center">
            {workloadData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data text-center">
                Nenhuma tarefa ativa.
              </div>
            ) : (
              <ChartContainer config={workloadConfig} className="h-full w-full">
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  data={workloadData}
                  margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis
                    dataKey="who"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={85}
                    tickFormatter={(val) =>
                      val.length > 12 ? `${val.slice(0, 10)}...` : val
                    }
                  />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="inProgress" stackId="a" fill="var(--color-inProgress)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="notStarted" stackId="a" fill="var(--color-notStarted)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 3. Top 5 com Mais Atrasos */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Top 5 com Mais Atrasos
            </h3>
            <span className="text-[10px] text-destructive font-mono-data font-bold shrink-0 ml-1">
              Crítico
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[280px] h-[300px] flex items-center justify-center">
            {topOverdueData.length === 0 ? (
              <div className="text-xs text-primary font-mono-data text-center">
                ✓ Nenhuma tarefa com atraso!
              </div>
            ) : (
              <ChartContainer config={overdueConfig} className="h-full w-full">
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  data={topOverdueData}
                  margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis
                    dataKey="who"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={85}
                    tickFormatter={(val) =>
                      val.length > 12 ? `${val.slice(0, 10)}...` : val
                    }
                  />
                  <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="overdue" fill="var(--color-overdue)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 4. Taxa de Conclusão no Prazo por Responsável (%) */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data truncate">
              Taxa de Conclusão no Prazo
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data shrink-0 ml-1">
              SLA (%)
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[280px] h-[300px] flex items-center justify-center">
            {onTimeRateData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data text-center">
                Nenhum dado disponível.
              </div>
            ) : (
              <ChartContainer config={onTimeRateConfig} className="h-full w-full">
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  data={onTimeRateData}
                  margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis
                    dataKey="who"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={85}
                    tickFormatter={(val) =>
                      val.length > 12 ? `${val.slice(0, 10)}...` : val
                    }
                  />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} unit="%" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val) => `${val}%`}
                      />
                    }
                  />
                  <Bar dataKey="rate" fill="var(--color-rate)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
