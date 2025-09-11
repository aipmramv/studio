// src/components/charts/SampleLineChart.tsx
"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"

interface SampleLineChartProps {
  data: any[];
  title: string;
  description?: string;
  dataKeyX: string;
  dataKeyY: string | string[]; // Allow single or multiple keys
  strokeColor?: string;
}

export function SampleLineChart({ data, title, description, dataKeyX, dataKeyY, strokeColor = "hsl(var(--primary))" }: SampleLineChartProps) {
  
  const yKeys = Array.isArray(dataKeyY) ? dataKeyY : [dataKeyY];

  const chartConfig = yKeys.reduce((acc, key, index) => {
    acc[key] = {
      label: key.charAt(0).toUpperCase() + key.slice(1),
      color: `hsl(var(--chart-${(index % 5) + 1}))`,
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={dataKeyX} stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 2 }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
            />
            <Legend wrapperStyle={{ fontSize: '0.875rem' }} />
            {yKeys.map((key) => (
                 <defs key={`def-${key}`}>
                    <linearGradient id={`color-${key.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartConfig[key].color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={chartConfig[key].color} stopOpacity={0}/>
                    </linearGradient>
                </defs>
            ))}
             {yKeys.map((key) => (
                <Area 
                    key={key}
                    type="monotone" 
                    dataKey={key} 
                    stroke={chartConfig[key].color} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill={`url(#color-${key.replace(/\s/g, '')})`}
                />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
