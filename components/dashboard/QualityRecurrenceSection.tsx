'use client';

import React, { useMemo } from 'react';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import { calculateTaskDeadlineInfo } from '@/lib/5w2h-utils';
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
import { CheckCheck } from 'lucide-react';

interface QualityRecurrenceSectionProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
}

const problematicConfig = {
  overdueRate: {
    label: 'Taxa de Atraso (%)',
    color: 'var(--destructive)',
  },
} satisfies ChartConfig;

const cancellationConfig = {
  Canceladas: {
    label: 'Canceladas',
    color: 'var(--destructive)',
  },
  Ativas: {
    label: 'Ativas / Concluídas',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

export const QualityRecurrenceSection: React.FC<QualityRecurrenceSectionProps> = ({
  tasks,
  workspaceConfig,
}) => {
  // 23. Rotinas Mais Problemáticas (% de atraso por categoria/rotina)
  const problematicRoutines = useMemo(() => {
    const map: Record<string, { total: number; overdue: number }> = {};

    tasks.forEach((t) => {
      const cat = t.category || 'Geral';
      if (!map[cat]) map[cat] = { total: 0, overdue: 0 };
      map[cat].total += 1;

      const calc = calculateTaskDeadlineInfo(
        t.deadlineDate,
        t.status,
        workspaceConfig.attentionThresholdDays
      );
      if (calc.deadlineSituation === 'Atrasado') {
        map[cat].overdue += 1;
      }
    });

    return Object.entries(map)
      .filter(([, stats]) => stats.total >= 1)
      .map(([category, stats]) => {
        const rate = Math.round((stats.overdue / stats.total) * 100);
        return {
          category,
          overdueRate: rate,
          overdueCount: stats.overdue,
          totalCount: stats.total,
        };
      })
      .sort((a, b) => b.overdueRate - a.overdueRate)
      .slice(0, 6);
  }, [tasks, workspaceConfig.attentionThresholdDays]);

  // 24. Taxa de Cancelamento (Donut)
  const cancellationData = useMemo(() => {
    const cancelled = tasks.filter((t) => t.status === 'Cancelado').length;
    const others = tasks.length - cancelled;

    return [
      { name: 'Canceladas', value: cancelled, color: 'var(--destructive)' },
      { name: 'Ativas', value: others, color: 'var(--primary)' },
    ].filter((item) => item.value > 0);
  }, [tasks]);

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2 pt-2">
        <CheckCheck className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider font-mono-data text-foreground">
          Qualidade e Recorrência
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 23. Rotinas Mais Problemáticas (Maior taxa de atraso) */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Rotinas Mais Problemáticas (Taxa de Atraso)
            </h3>
            <span className="text-[10px] text-destructive font-mono-data font-bold">
              Maior Vulnerabilidade
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[240px] flex items-center justify-center">
            {problematicRoutines.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Nenhum registro encontrado.
              </div>
            ) : (
              <ChartContainer config={problematicConfig} className="min-h-[220px] w-full">
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  data={problematicRoutines}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis
                    dataKey="category"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                    tickFormatter={(val) =>
                      val.length > 12 ? `${val.slice(0, 10)}...` : val
                    }
                  />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} unit="%" />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val, name, item) =>
                          `${val}% (${item.payload.overdueCount}/${item.payload.totalCount} atrasadas)`
                        }
                      />
                    }
                  />
                  <Bar dataKey="overdueRate" fill="var(--color-overdueRate)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 24. Taxa de Cancelamento */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Taxa de Cancelamento
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Descartes vs Conclusão
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[240px] flex flex-col items-center justify-center">
            {cancellationData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Nenhuma tarefa registrada.
              </div>
            ) : (
              <ChartContainer config={cancellationConfig} className="min-h-[220px] w-full">
                <PieChart>
                  <Pie
                    data={cancellationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {cancellationData.map((entry, index) => (
                      <Cell key={`cancel-cell-${index}`} fill={entry.color} stroke="var(--card)" />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
