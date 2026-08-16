'use client';

import React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

export interface CompetenceChartData {
  competence: string;
  total: number;
  completed: number;
}

export const competenceChartConfig = {
  total: {
    label: 'Total de Tarefas',
    color: 'var(--info)',
  },
  completed: {
    label: 'Concluídas',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

interface CompetenceBarChartProps {
  data: CompetenceChartData[];
  className?: string;
}

export function CompetenceBarChart({ data, className }: CompetenceBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full min-h-[280px] flex items-center justify-center text-xs text-muted-foreground font-mono-data">
        Nenhum dado disponível para o filtro selecionado.
      </div>
    );
  }

  return (
    <ChartContainer config={competenceChartConfig} className={className || 'h-full min-h-[280px] w-full'}>
      <BarChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="competence"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" fill="var(--color-completed)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
