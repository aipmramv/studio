// src/app/(app)/kpi-dashboard/page.tsx
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SampleBarChart } from "@/components/charts/SampleBarChart";
import { SampleLineChart } from "@/components/charts/SampleLineChart";
import { TrendingUp, Package, AlertTriangle, Clock } from "lucide-react";

// Mock data for charts
const dailyRequestsData = [
  { date: "Mon", requests: 22 },
  { date: "Tue", requests: 35 },
  { date: "Wed", requests: 28 },
  { date: "Thu", requests: 42 },
  { date: "Fri", requests: 30 },
  { date: "Sat", requests: 15 },
  { date: "Sun", requests: 10 },
];

const materialVolumeData = [
  { month: "Jan", volume: 1200 },
  { month: "Feb", volume: 1500 },
  { month: "Mar", volume: 1300 },
  { month: "Apr", volume: 1700 },
  { month: "May", volume: 1600 },
  { month: "Jun", volume: 1900 },
];

const kpiStats = [
    { title: "Total Requests Today", value: "125", icon: TrendingUp, color: "text-primary" }, // Was text-green-500
    { title: "Scrap Moved (This Week)", value: "2.5 Tons", icon: Package, color: "text-primary" }, // Was text-blue-500, mapping to primary as it's a prominent blue
    { title: "Pending Approvals", value: "18", icon: Clock, color: "text-accent" },  // Was text-yellow-500
    { title: "Delayed Approvals (>48h)", value: "3", icon: AlertTriangle, color: "text-destructive" }, // Was text-red-500
];


export default function KpiDashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="KPI Dashboard"
        description="Overview of key performance indicators and system metrics."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map((stat, index) => (
          <Card key={index} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SampleLineChart
          data={dailyRequestsData}
          title="Daily Requests Overview"
          description="Number of requests processed per day over the last week."
          dataKeyX="date"
          dataKeyY="requests"
          strokeColor="hsl(var(--accent))"
        />
        <SampleBarChart
          data={materialVolumeData}
          title="Material Movement Volume"
          description="Total volume of materials moved per month."
          dataKeyX="month"
          dataKeyY="volume"
          fillColor="hsl(var(--primary))"
        />
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline">Delayed Approvals Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
            {/* This could be a table or a more detailed chart */}
            <p className="text-muted-foreground">Detailed list of approvals pending for more than 48 hours:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
                <li className="text-sm">Request MM001 (Steel Beams) - Pending with Finance (72h)</li>
                <li className="text-sm">Request WP003 (Server Maintenance) - Pending with Safety (50h)</li>
                <li className="text-sm">Request SM002 (E-waste) - Pending with MM Head (49h)</li>
            </ul>
        </CardContent>
      </Card>

    </div>
  );
}
