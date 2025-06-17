
// src/app/(app)/reports/monthly-budget-report/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { AreaChart, Briefcase, CalendarDays, Users as UsersIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DEPARTMENTS, FISCAL_YEARS, MOCK_MONTHLY_BUDGET_DATA, getFiscalMonthName, type Department, type FiscalYear, type MonthlyBudgetRecord } from "@/lib/constants";
import { MonthlyBudgetChart } from "@/components/charts/MonthlyBudgetChart";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as UIDialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReportDataRow {
  monthIndex: number; // Keep original monthIndex for linking back to full record
  monthName: string;
  forecastedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  fullRecord: MonthlyBudgetRecord; // Store the full record for drilldown
}

export default function MonthlyBudgetReportPage() {
  const { user } = useAuth();
  
  const initialDepartment = user?.role === 'department_head' && user.department && DEPARTMENTS.includes(user.department as Department) 
    ? user.department as Department 
    : (user?.role === 'admin' ? DEPARTMENTS[0] : undefined);

  const [selectedDepartment, setSelectedDepartment] = React.useState<Department | undefined>(initialDepartment);
  const [selectedYear, setSelectedYear] = React.useState<FiscalYear>(FISCAL_YEARS[FISCAL_YEARS.length - 1]); 
  const [selectedMonthDataForDrilldown, setSelectedMonthDataForDrilldown] = React.useState<MonthlyBudgetRecord | null>(null);
  const [isDrilldownModalOpen, setIsDrilldownModalOpen] = React.useState(false);


  const formattingOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const reportData = React.useMemo((): ReportDataRow[] => {
    if (!selectedDepartment || !selectedYear) return [];

    return MOCK_MONTHLY_BUDGET_DATA
      .filter(item => item.department === selectedDepartment && item.year === selectedYear)
      .sort((a, b) => a.monthIndex - b.monthIndex)
      .map(item => {
        const varianceAmount = item.actualAmount - item.forecastedAmount;
        const variancePercentage = item.forecastedAmount !== 0 
          ? (varianceAmount / item.forecastedAmount) * 100 
          : (item.actualAmount > 0 ? Infinity : 0); 
        return {
          monthIndex: item.monthIndex,
          monthName: getFiscalMonthName(item.monthIndex),
          forecastedAmount: item.forecastedAmount,
          actualAmount: item.actualAmount,
          varianceAmount: varianceAmount,
          variancePercentage: variancePercentage,
          fullRecord: item, // Store the full record
        };
      });
  }, [selectedDepartment, selectedYear]);

  const chartData = reportData.map(row => ({
    monthName: row.monthName,
    forecasted: row.forecastedAmount,
    actual: row.actualAmount,
  }));

  const totals = React.useMemo(() => {
    return reportData.reduce((acc, row) => {
      acc.forecasted += row.forecastedAmount;
      acc.actual += row.actualAmount;
      return acc;
    }, { forecasted: 0, actual: 0 });
  }, [reportData]);

  const totalVarianceAmount = totals.actual - totals.forecasted;
  const totalVariancePercentage = totals.forecasted !== 0
    ? (totalVarianceAmount / totals.forecasted) * 100
    : (totals.actual > 0 ? Infinity : 0);

  const handleMonthClick = (rowData: ReportDataRow) => {
    setSelectedMonthDataForDrilldown(rowData.fullRecord);
    setIsDrilldownModalOpen(true);
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Monthly Budget Forecast vs Actuals"
        description="Track and analyze departmental budget performance on a monthly basis. Click on a month name to see user-wise breakdown."
      />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="font-headline flex items-center"><AreaChart className="w-5 h-5 mr-2 text-primary"/> Report Filters</CardTitle>
              <CardDescription>Select department and fiscal year to view the report.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {user?.role === 'admin' && (
                <Select value={selectedDepartment} onValueChange={(val) => setSelectedDepartment(val as Department)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}><Briefcase className="inline w-4 h-4 mr-2 text-muted-foreground"/>{dept}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val as FiscalYear)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Select Fiscal Year" />
                </SelectTrigger>
                <SelectContent>
                  {FISCAL_YEARS.map(year => <SelectItem key={year} value={year}><CalendarDays className="inline w-4 h-4 mr-2 text-muted-foreground"/>{year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!selectedDepartment ? (
            <p className="text-center text-muted-foreground py-8">
              {user?.role === 'admin' ? "Please select a department to view the report." : "No department assigned to view this report."}
            </p>
          ) : reportData.length === 0 ? (
             <p className="text-center text-muted-foreground py-8">
              No monthly budget data found for {selectedDepartment} for the fiscal year {selectedYear}.
            </p>
          ) : (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Data Table: {selectedDepartment} - {selectedYear}</h3>
                <div className="overflow-x-auto border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Forecasted</TableHead>
                        <TableHead className="text-right">Actual</TableHead>
                        <TableHead className="text-right">Variance</TableHead>
                        <TableHead className="text-right">Variance %</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.map((row) => (
                        <TableRow key={row.monthName}>
                          <TableCell className="font-medium">
                             <Button 
                                variant="link" 
                                className="p-0 h-auto text-foreground hover:text-primary"
                                onClick={() => handleMonthClick(row)}
                            >
                                {row.monthName}
                            </Button>
                          </TableCell>
                          <TableCell className="text-right">{row.forecastedAmount.toLocaleString('en-IN', formattingOptions)}</TableCell>
                          <TableCell className="text-right">
                            {row.actualAmount.toLocaleString('en-IN', formattingOptions)}
                          </TableCell>
                          <TableCell 
                            className={cn(
                              "text-right",
                              row.varianceAmount > 0 ? "text-destructive" : row.varianceAmount < 0 ? "text-green-600" : "text-foreground"
                            )}
                          >
                            {row.varianceAmount.toLocaleString('en-IN', formattingOptions)}
                          </TableCell>
                          <TableCell 
                             className={cn(
                              "text-right",
                               row.variancePercentage > 0 ? "text-destructive" : row.variancePercentage < 0 ? "text-green-600" : "text-foreground"
                            )}
                          >
                            {isFinite(row.variancePercentage) ? `${row.variancePercentage.toFixed(2)}%` : (row.actualAmount > 0 ? "New Spend" : "N/A")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell>Total / Average</TableCell>
                        <TableCell className="text-right">{totals.forecasted.toLocaleString('en-IN', formattingOptions)}</TableCell>
                        <TableCell className="text-right">{totals.actual.toLocaleString('en-IN', formattingOptions)}</TableCell>
                        <TableCell 
                          className={cn(
                            "text-right",
                            totalVarianceAmount > 0 ? "text-destructive" : totalVarianceAmount < 0 ? "text-green-600" : "text-foreground"
                          )}
                        >
                          {totalVarianceAmount.toLocaleString('en-IN', formattingOptions)}
                        </TableCell>
                        <TableCell 
                          className={cn(
                            "text-right",
                             totalVariancePercentage > 0 ? "text-destructive" : totalVariancePercentage < 0 ? "text-green-600" : "text-foreground"
                          )}
                        >
                          {isFinite(totalVariancePercentage) ? `${totalVariancePercentage.toFixed(2)}%` : (totals.actual > 0 ? "New Spend" : "N/A")}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              </div>
              <div>
                 <MonthlyBudgetChart 
                    data={chartData}
                    title={`Forecast vs. Actuals: ${selectedDepartment} - ${selectedYear}`}
                    description="Monthly comparison of budgeted and spent amounts."
                 />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedMonthDataForDrilldown && (
        <Dialog open={isDrilldownModalOpen} onOpenChange={(isOpen) => {
            setIsDrilldownModalOpen(isOpen);
            if (!isOpen) {
                setSelectedMonthDataForDrilldown(null); // Clear data when closing
            }
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UsersIcon className="w-5 h-5 mr-2 text-primary" />
                User-wise Actuals: {getFiscalMonthName(selectedMonthDataForDrilldown.monthIndex)} - {selectedMonthDataForDrilldown.department} ({selectedMonthDataForDrilldown.year})
              </DialogTitle>
              <DialogDescription>
                Breakdown of actual expenditure by user for the selected month.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-6 py-4">
              {(selectedMonthDataForDrilldown.userBreakdown && selectedMonthDataForDrilldown.userBreakdown.length > 0) ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User Name</TableHead>
                      <TableHead className="text-right">Actual Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedMonthDataForDrilldown.userBreakdown.map((item, index) => (
                      <TableRow key={item.userId + index}>
                        <TableCell className="font-medium">{item.userName}</TableCell>
                        <TableCell className="text-right">{item.actualAmount.toLocaleString('en-IN', formattingOptions)}</TableCell>
                      </TableRow>
                    ))}
                     <TableRow className="font-semibold bg-muted/50">
                        <TableCell>Total for Month</TableCell>
                        <TableCell className="text-right">
                          {selectedMonthDataForDrilldown.actualAmount.toLocaleString('en-IN', formattingOptions)}
                        </TableCell>
                      </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-4">
                  No user-wise breakdown data available for this month.
                </p>
              )}
            </ScrollArea>
            <UIDialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </UIDialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

