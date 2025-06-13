// src/components/charts/SampleLineChart.tsx
"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"

interface SampleLineChartProps {
  data: any[];
  title: string;
  description?: string;
  dataKeyX: string;
  dataKeyY: string;
  strokeColor?: string;
}

export function SampleLineChart({ data, title, description, dataKeyX, dataKeyY, strokeColor = "hsl(var(--primary))" }: SampleLineChartProps) {
 const chartConfig = {
    [dataKeyY]: {
      label: dataKeyY.charAt(0).toUpperCase() + dataKeyY.slice(1),
      color: strokeColor,
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
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={dataKeyX} stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2 }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
            />
            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
            <Line type="monotone" dataKey={dataKeyY} stroke={chartConfig[dataKeyY].color} strokeWidth={2} dot={{ r: 4, fill: chartConfig[dataKeyY].color }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
