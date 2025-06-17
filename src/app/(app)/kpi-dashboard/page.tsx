
// src/app/(app)/kpi-dashboard/page.tsx
"use client";
import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SampleBarChart } from "@/components/charts/SampleBarChart";
import { SampleLineChart } from "@/components/charts/SampleLineChart";
import { TrendingUp, Package, AlertTriangle, Clock, Landmark, DollarSign, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DEPARTMENTS, FISCAL_YEARS, QUARTERS, MOCK_DEPARTMENT_BUDGETS, type Department, type FiscalYear, type Quarter } from "@/lib/constants";

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
    { title: "Total Requests Today", value: "125", icon: TrendingUp, color: "text-primary" },
    { title: "Scrap Moved (This Week)", value: "2.5 Tons", icon: Package, color: "text-primary" },
    { title: "Pending Approvals", value: "18", icon: Clock, color: "text-accent" },
    { title: "Delayed Approvals (>48h)", value: "3", icon: AlertTriangle, color: "text-destructive" },
];


export default function KpiDashboardPage() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | undefined>(
    user?.role === 'department_head' && user.department ? user.department as Department : undefined
  );
  const [selectedYear, setSelectedYear] = React.useState<FiscalYear>(FISCAL_YEARS[FISCAL_YEARS.length-1]); // Default to latest year
  const [selectedQuarter, setSelectedQuarter] = React.useState<Quarter>("Full Year");

  const formattingOptions: Intl.NumberFormatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 0 };


  const departmentBudget = React.useMemo(() => {
    if (!selectedDepartment || !selectedYear) return null;
    return MOCK_DEPARTMENT_BUDGETS.find(
      (b) => b.department === selectedDepartment && b.year === selectedYear
    );
  }, [selectedDepartment, selectedYear]);

  const budgetDataForPeriod = React.useMemo(() => {
    if (!departmentBudget) return { total: 0, utilized: 0, unutilized: 0 };

    let total = 0;
    switch (selectedQuarter) {
      case "Q1 (Apr-Jun)": total = departmentBudget.q1Budget; break;
      case "Q2 (Jul-Sep)": total = departmentBudget.q2Budget; break;
      case "Q3 (Oct-Dec)": total = departmentBudget.q3Budget; break;
      case "Q4 (Jan-Mar)": total = departmentBudget.q4Budget; break;
      case "Full Year":
      default:
        total = departmentBudget.q1Budget + departmentBudget.q2Budget + departmentBudget.q3Budget + departmentBudget.q4Budget;
        break;
    }
    // Mock utilization: 60-90% of budget for demo
    const utilized = total * (Math.random() * 0.3 + 0.6); 
    const unutilized = total - utilized;
    return { total, utilized, unutilized };
  }, [departmentBudget, selectedQuarter]);

  const budgetChartData = [
    { name: "Budgeted", value: budgetDataForPeriod.total },
    { name: "Utilized", value: budgetDataForPeriod.utilized },
  ];


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

      { (user?.role === 'admin' || user?.role === 'department_head') && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <CardTitle className="font-headline flex items-center"><Landmark className="w-5 h-5 mr-2 text-primary"/> Department Budget Overview</CardTitle>
                    <CardDescription>Track budget utilization for the selected department and period.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    {user?.role === 'admin' && (
                        <Select value={selectedDepartment} onValueChange={(val) => setSelectedDepartment(val as Department)}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Select Department" />
                            </SelectTrigger>
                            <SelectContent>
                                {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val as FiscalYear)}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {FISCAL_YEARS.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={selectedQuarter} onValueChange={(val) => setSelectedQuarter(val as Quarter)}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Select Quarter" />
                        </SelectTrigger>
                        <SelectContent>
                            {QUARTERS.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedDepartment && user?.role === 'admin' ? (
                 <p className="text-center text-muted-foreground py-8">Please select a department to view budget details.</p>
            ) : !departmentBudget ? (
                 <p className="text-center text-muted-foreground py-8">No budget data found for {selectedDepartment} for the year {selectedYear}. Please add it in Masters.</p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1 space-y-4">
                    <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><DollarSign className="w-4 h-4 mr-1"/>Total Budget</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-foreground">{budgetDataForPeriod.total.toLocaleString('en-IN', formattingOptions)}</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><DollarSign className="w-4 h-4 mr-1 text-primary"/>Utilized Budget</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-primary">{budgetDataForPeriod.utilized.toLocaleString('en-IN', formattingOptions)}</p></CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><DollarSign className="w-4 h-4 mr-1 text-accent"/>Unutilized Budget</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-accent">{budgetDataForPeriod.unutilized.toLocaleString('en-IN', formattingOptions)}</p></CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2">
                  <SampleBarChart
                    data={budgetChartData}
                    title="Budget vs. Utilization"
                    description={`For ${selectedDepartment} - ${selectedQuarter}, ${selectedYear}`}
                    dataKeyX="name"
                    dataKeyY="value"
                    fillColor="hsl(var(--accent))"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}


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

