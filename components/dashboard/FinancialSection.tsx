'use client';

import React, { useMemo } from 'react';
import { Task5W2H, WorkspaceConfig } from '@/types/5w2h';
import { formatCurrency } from '@/lib/5w2h-utils';
import {
  Bar,
  BarChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  RadialBar,
  RadialBarChart,
  PolarAngleAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { DollarSign } from 'lucide-react';

interface FinancialSectionProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
}

const plannedVsRealizedConfig = {
  planned: {
    label: 'Planejado',
    color: 'var(--chart-1)',
  },
  realized: {
    label: 'Realizado',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const costByCategoryConfig = {
  cost: {
    label: 'Custo Total',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const costEvolutionConfig = {
  cost: {
    label: 'Custo na Competência',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const gaugeConfig = {
  spent: {
    label: 'Consumido',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const DEPT_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--info)',
  'var(--primary)',
];

export const FinancialSection: React.FC<FinancialSectionProps> = ({
  tasks,
  workspaceConfig,
}) => {
  // 5. Orçamento Planejado vs. Realizado (por Departamento / Categoria)
  const plannedVsRealizedData = useMemo(() => {
    const map: Record<string, { name: string; planned: number; realized: number }> = {};
    tasks.forEach((t) => {
      const dept = t.department || 'Geral';
      if (!map[dept]) {
        map[dept] = { name: dept, planned: 0, realized: 0 };
      }
      const planned = t.howMuch || 0;
      map[dept].planned += planned;
      // Realized calculation based on status & progress
      const realized =
        t.status === 'Concluído'
          ? planned * 0.96
          : planned * ((t.progressPercent || 0) / 100);
      map[dept].realized += Math.round(realized);
    });

    return Object.values(map)
      .filter((item) => item.planned > 0 || item.realized > 0)
      .slice(0, 6);
  }, [tasks]);

  // 6. Custo por Departamento (Donut)
  const costByDeptData = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      const dept = t.department || 'Geral';
      map[dept] = (map[dept] || 0) + (t.howMuch || 0);
    });

    return Object.entries(map)
      .map(([name, value], idx) => ({
        name,
        value,
        color: DEPT_COLORS[idx % DEPT_COLORS.length],
      }))
      .filter((item) => item.value > 0);
  }, [tasks]);

  const costByDeptConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    costByDeptData.forEach((item) => {
      cfg[item.name] = { label: item.name, color: item.color };
    });
    return cfg satisfies ChartConfig;
  }, [costByDeptData]);

  // 7. Custo por Categoria/Rotina
  const costByCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      const cat = t.category || 'Geral';
      map[cat] = (map[cat] || 0) + (t.howMuch || 0);
    });

    return Object.entries(map)
      .map(([category, cost]) => ({ category, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 6);
  }, [tasks]);

  // 8. Evolução do Custo por Competência
  const costEvolutionData = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      const comp = t.competence || 'N/A';
      map[comp] = (map[comp] || 0) + (t.howMuch || 0);
    });

    return Object.entries(map)
      .map(([competence, cost]) => ({ competence, cost }))
      .sort((a, b) => a.competence.localeCompare(b.competence));
  }, [tasks]);

  // 9. Consumo do Orçamento Total (Gauge)
  const totalPlanned = useMemo(() => {
    return tasks.reduce((sum, t) => sum + (t.howMuch || 0), 0);
  }, [tasks]);

  const totalSpent = useMemo(() => {
    return tasks.reduce((sum, t) => {
      const p = t.howMuch || 0;
      const r =
        t.status === 'Concluído'
          ? p
          : p * ((t.progressPercent || 0) / 100);
      return sum + r;
    }, 0);
  }, [tasks]);

  const budgetConsumptionPct = useMemo(() => {
    if (totalPlanned === 0) return 0;
    return Math.min(100, Math.round((totalSpent / totalPlanned) * 100));
  }, [totalPlanned, totalSpent]);

  // Gauge color based on range: green <= 70%, amber 70-90%, red > 90%
  const gaugeColor = useMemo(() => {
    if (budgetConsumptionPct > 90) return 'var(--destructive)';
    if (budgetConsumptionPct >= 70) return 'var(--warning)';
    return 'var(--primary)';
  }, [budgetConsumptionPct]);

  const gaugeData = [
    {
      name: 'Consumido',
      value: budgetConsumptionPct,
      fill: gaugeColor,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2 pt-2">
        <DollarSign className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider font-mono-data text-foreground">
          Financeiro (Quanto)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 5. Orçamento Planejado vs. Realizado */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Orçamento Planejado vs. Realizado
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Por Departamento ({workspaceConfig.currencySymbol})
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[240px] flex items-center justify-center">
            {plannedVsRealizedData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Nenhum orçamento cadastrado.
              </div>
            ) : (
              <ChartContainer config={plannedVsRealizedConfig} className="min-h-[220px] w-full">
                <BarChart
                  accessibilityLayer
                  data={plannedVsRealizedData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val.length > 10 ? `${val.slice(0, 8)}...` : val
                    }
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val) =>
                          formatCurrency(Number(val), workspaceConfig.currencySymbol)
                        }
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="planned" fill="var(--color-planned)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realized" fill="var(--color-realized)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 6. Custo por Departamento (Donut) */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Custo por Departamento
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Distribuição %
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[240px] flex flex-col items-center justify-center">
            {costByDeptData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Nenhum custo lançado no filtro.
              </div>
            ) : (
              <ChartContainer config={costByDeptConfig} className="min-h-[220px] w-full">
                <PieChart>
                  <Pie
                    data={costByDeptData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {costByDeptData.map((entry, index) => (
                      <Cell key={`dept-cell-${index}`} fill={entry.color} stroke="var(--card)" />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val) =>
                          formatCurrency(Number(val), workspaceConfig.currencySymbol)
                        }
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 7. Custo por Categoria / Rotina */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Custo por Categoria / Rotina
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Top Despesas
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[240px] flex items-center justify-center">
            {costByCategoryData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Nenhum registro encontrado.
              </div>
            ) : (
              <ChartContainer config={costByCategoryConfig} className="min-h-[220px] w-full">
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  data={costByCategoryData}
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
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val) =>
                          formatCurrency(Number(val), workspaceConfig.currencySymbol)
                        }
                      />
                    }
                  />
                  <Bar dataKey="cost" fill="var(--color-cost)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 8. Evolução do Custo por Competência (Area Chart) */}
        <div className="bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Evolução do Custo por Competência
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Linha Temporal
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[240px] flex items-center justify-center">
            {costEvolutionData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Nenhum dado financeiro temporal.
              </div>
            ) : (
              <ChartContainer config={costEvolutionConfig} className="min-h-[220px] w-full">
                <AreaChart
                  accessibilityLayer
                  data={costEvolutionData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="competence" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val) =>
                          formatCurrency(Number(val), workspaceConfig.currencySymbol)
                        }
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="var(--color-cost)"
                    fill="var(--color-cost)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 9. Consumo do Orçamento Total (Gauge) - Spans full width or 2 cols on lg if desired */}
        <div className="lg:col-span-2 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Consumo do Orçamento Total (Gauge)
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Meta vs Comprometido
            </span>
          </div>
          <div className="p-4 flex-1 flex flex-col md:flex-row items-center justify-around gap-6 min-h-[200px]">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <ChartContainer config={gaugeConfig} className="w-full h-full aspect-square">
                <RadialBarChart
                  data={gaugeData}
                  startAngle={180}
                  endAngle={0}
                  innerRadius={70}
                  outerRadius={100}
                >
                  <PolarAngleAxis
                    type="number"
                    domain={[0, 100]}
                    angleAxisId={0}
                    tick={false}
                  />
                  <RadialBar
                    background
                    dataKey="value"
                    cornerRadius={6}
                    fill={gaugeColor}
                  />
                </RadialBarChart>
              </ChartContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                <span className="text-2xl font-bold font-mono-data text-foreground">
                  {budgetConsumptionPct}%
                </span>
                <span className="text-[10px] font-mono-data text-muted-foreground uppercase">
                  Comprometido
                </span>
              </div>
            </div>

            <div className="space-y-3 font-mono-data text-xs max-w-sm">
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Orçamento Planejado:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(totalPlanned, workspaceConfig.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-1.5">
                <span className="text-muted-foreground">Orçamento Comprometido:</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(totalSpent, workspaceConfig.currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-muted-foreground">Status do Consumo:</span>
                <span
                  className="font-bold px-2 py-0.5 text-[11px] uppercase"
                  style={{
                    color: gaugeColor,
                    backgroundColor: 'var(--muted)',
                  }}
                >
                  {budgetConsumptionPct > 90
                    ? 'Crítico (>90%)'
                    : budgetConsumptionPct >= 70
                    ? 'Atenção (70-90%)'
                    : 'Saudável (≤70%)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
