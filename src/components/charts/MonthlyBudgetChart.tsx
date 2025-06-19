
// src/components/charts/MonthlyBudgetChart.tsx
"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartConfig } from "@/components/ui/chart"; // Assuming ChartConfig is exported

interface MonthlyBudgetDataPoint {
  monthName: string;
  forecasted: number;
  actual: number;
}

interface MonthlyBudgetChartProps {
  data: MonthlyBudgetDataPoint[];
  title: string;
  description?: string;
}

export function MonthlyBudgetChart({ data, title, description }: MonthlyBudgetChartProps) {
  const chartConfig = {
    forecasted: {
      label: "Forecasted (INR)",
      color: "hsl(var(--chart-2))", // Accent color
    },
    actual: {
      label: "Actual (INR)",
      color: "hsl(var(--chart-1))", // Primary color
    },
  } satisfies ChartConfig;

  const currencyTickFormatter = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact', compactDisplay: 'short' }).format(value);

  const currencyTooltipFormatter = (value: number, name: string) => {
    const label = chartConfig[name as keyof typeof chartConfig]?.label || name;
    const formattedValue = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
    return [formattedValue, label];
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="monthName"
              stroke="hsl(var(--foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={currencyTickFormatter}
            />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1.5 }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
              formatter={currencyTooltipFormatter}
            />
            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
            <Line
              type="monotone"
              dataKey="forecasted"
              stroke={chartConfig.forecasted.color}
              strokeWidth={2}
              dot={{ r: 4, fill: chartConfig.forecasted.color }}
              activeDot={{ r: 6 }}
              name={chartConfig.forecasted.label}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke={chartConfig.actual.color}
              strokeWidth={2}
              dot={{ r: 4, fill: chartConfig.actual.color }}
              activeDot={{ r: 6 }}
              name={chartConfig.actual.label}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


