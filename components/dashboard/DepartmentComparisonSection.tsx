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
  Cell,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Building2 } from 'lucide-react';

interface DepartmentComparisonProps {
  tasks: Task5W2H[];
  workspaceConfig: WorkspaceConfig;
}

const RADAR_COLORS = [
  'var(--primary)',
  'var(--chart-2)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const healthScoreConfig = {
  score: {
    label: 'Score de Saúde',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

const volumeConfig = {
  tasks: {
    label: 'Volume de Tarefas',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export const DepartmentComparisonSection: React.FC<DepartmentComparisonProps> = ({
  tasks,
  workspaceConfig,
}) => {
  // Aggregate data per department
  const deptStats = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        total: number;
        completed: number;
        overdue: number;
        totalCost: number;
      }
    > = {};

    tasks.forEach((t) => {
      const dept = t.department?.trim() || 'Geral';
      if (!map[dept]) {
        map[dept] = {
          name: dept,
          total: 0,
          completed: 0,
          overdue: 0,
          totalCost: 0,
        };
      }

      map[dept].total += 1;
      map[dept].totalCost += t.howMuch || 0;
      if (t.status === 'Concluído') {
        map[dept].completed += 1;
      }

      const calc = calculateTaskDeadlineInfo(
        t.deadlineDate,
        t.status,
        workspaceConfig.attentionThresholdDays
      );
      if (calc.deadlineSituation === 'Atrasado') {
        map[dept].overdue += 1;
      }
    });

    return Object.values(map);
  }, [tasks, workspaceConfig.attentionThresholdDays]);

  // 14. Radar Comparativo entre Departamentos
  // Top 3 departments
  const topDepts = useMemo(() => {
    return [...deptStats].sort((a, b) => b.total - a.total).slice(0, 3);
  }, [deptStats]);

  const radarData = useMemo(() => {
    if (topDepts.length === 0) return [];

    const maxVolume = Math.max(...topDepts.map((d) => d.total), 1);
    const maxCost = Math.max(...topDepts.map((d) => d.totalCost), 1);

    const metrics = [
      { metric: '% Concluído', key: 'completionRate' },
      { metric: '% No Prazo', key: 'onTimeRate' },
      { metric: 'Volume Tarefas', key: 'normalizedVolume' },
      { metric: 'Custo Normalizado', key: 'normalizedCost' },
    ];

    return metrics.map((m) => {
      const row: Record<string, any> = { metric: m.metric };
      topDepts.forEach((dept) => {
        if (m.key === 'completionRate') {
          row[dept.name] =
            dept.total > 0
              ? Math.round((dept.completed / dept.total) * 100)
              : 0;
        } else if (m.key === 'onTimeRate') {
          row[dept.name] =
            dept.total > 0
              ? Math.round(((dept.total - dept.overdue) / dept.total) * 100)
              : 0;
        } else if (m.key === 'normalizedVolume') {
          row[dept.name] = Math.round((dept.total / maxVolume) * 100);
        } else if (m.key === 'normalizedCost') {
          row[dept.name] = Math.round((dept.totalCost / maxCost) * 100);
        }
      });
      return row;
    });
  }, [topDepts]);

  const radarConfig = useMemo(() => {
    const cfg: Record<string, { label: string; color: string }> = {};
    topDepts.forEach((d, idx) => {
      cfg[d.name] = {
        label: d.name,
        color: RADAR_COLORS[idx % RADAR_COLORS.length],
      };
    });
    return cfg satisfies ChartConfig;
  }, [topDepts]);

  // 15. Ranking de Departamentos por Score de Saúde (0-100)
  // Composite score: 40% completion rate + 40% on time rate + 20% budget execution
  const healthScoreData = useMemo(() => {
    return deptStats
      .map((d) => {
        const compRate = d.total > 0 ? (d.completed / d.total) * 100 : 0;
        const onTimeRate =
          d.total > 0 ? ((d.total - d.overdue) / d.total) * 100 : 0;
        const score = Math.round(compRate * 0.5 + onTimeRate * 0.5);

        let color = 'var(--primary)';
        if (score < 50) color = 'var(--destructive)';
        else if (score < 80) color = 'var(--warning)';

        return {
          name: d.name,
          score,
          color,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [deptStats]);

  // 16. Volume de Tarefas por Departamento
  const volumeData = useMemo(() => {
    return [...deptStats]
      .map((d) => ({ department: d.name, tasks: d.total }))
      .sort((a, b) => b.tasks - a.tasks);
  }, [deptStats]);

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="flex items-center gap-2 pt-2">
        <Building2 className="w-4 h-4 text-primary" />
        <h2 className="text-xs font-bold uppercase tracking-wider font-mono-data text-foreground">
          Comparativo entre Departamentos
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 14. Radar Comparativo entre Departamentos (Spans 6 cols) */}
        <div className="lg:col-span-6 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Radar Comparativo Multidimensional
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Top 3 Departamentos
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[260px] flex items-center justify-center">
            {radarData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Dados insuficientes para radar.
              </div>
            ) : (
              <ChartContainer config={radarConfig} className="min-h-[240px] w-full">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="var(--border)"
                    tick={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {topDepts.map((dept, idx) => (
                    <Radar
                      key={dept.name}
                      name={dept.name}
                      dataKey={dept.name}
                      stroke={RADAR_COLORS[idx % RADAR_COLORS.length]}
                      fill={RADAR_COLORS[idx % RADAR_COLORS.length]}
                      fillOpacity={0.2}
                    />
                  ))}
                </RadarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 15. Ranking por Score de Saúde do Planejamento (Spans 6 cols) */}
        <div className="lg:col-span-6 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Score de Saúde do Planejamento (0–100)
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Composto (Entrega + SLA)
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[260px] flex items-center justify-center">
            {healthScoreData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Nenhum departamento registrado.
              </div>
            ) : (
              <ChartContainer config={healthScoreConfig} className="min-h-[240px] w-full">
                <BarChart
                  accessibilityLayer
                  layout="vertical"
                  data={healthScoreData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={90}
                    tickFormatter={(val) =>
                      val.length > 12 ? `${val.slice(0, 10)}...` : val
                    }
                  />
                  <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(val) => `Score: ${val}/100`}
                      />
                    }
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {healthScoreData.map((entry, index) => (
                      <Cell key={`health-cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* 16. Volume de Tarefas por Departamento (Spans 12 cols) */}
        <div className="lg:col-span-12 bg-card border border-border flex flex-col">
          <div className="p-3 border-b border-border flex justify-between items-center bg-card">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider font-mono-data">
              Volume Total de Tarefas por Departamento
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono-data">
              Distribuição Geral
            </span>
          </div>
          <div className="p-4 flex-1 min-h-[200px] flex items-center justify-center">
            {volumeData.length === 0 ? (
              <div className="text-xs text-muted-foreground font-mono-data">
                Nenhum dado encontrado.
              </div>
            ) : (
              <ChartContainer config={volumeConfig} className="min-h-[180px] w-full">
                <BarChart
                  accessibilityLayer
                  data={volumeData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="department"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val.length > 12 ? `${val.slice(0, 10)}...` : val
                    }
                  />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="tasks" fill="var(--color-tasks)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
