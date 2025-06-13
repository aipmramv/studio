// src/components/charts/SampleBarChart.tsx
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart" // Assuming ChartConfig is exported from chart.tsx

interface SampleBarChartProps {
  data: any[];
  title: string;
  description?: string;
  dataKeyX: string;
  dataKeyY: string;
  fillColor?: string;
}

export function SampleBarChart({ data, title, description, dataKeyX, dataKeyY, fillColor = "hsl(var(--primary))" }: SampleBarChartProps) {
  const chartConfig = {
    [dataKeyY]: {
      label: dataKeyY.charAt(0).toUpperCase() + dataKeyY.slice(1),
      color: fillColor,
    },
  } satisfies ChartConfig;
  
  return (
     <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={dataKeyX} stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
            />
            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
            <Bar dataKey={dataKeyY} fill={chartConfig[dataKeyY].color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
