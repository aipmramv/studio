// src/app/(app)/reports/asset-value-summary/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, TableFooter } from "@/components/ui/table";
import { DollarSign, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockAssetData } from "@/lib/mock-asset-data";
import { DEPARTMENTS, ASSET_CLASSIFICATIONS } from "@/lib/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SampleBarChart } from "@/components/charts/SampleBarChart";

type GroupingType = "Department" | "Category";

export default function AssetValueSummaryPage() {
  const { toast } = useToast();
  const [grouping, setGrouping] = React.useState<GroupingType>("Department");

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing asset value summary for ${format} export. This is a mock action.`,
    });
  };

  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const summaryData = React.useMemo(() => {
    const dataMap = new Map<string, { count: number; totalValue: number }>();
    const groupKey = grouping === 'Department' ? 'department' : 'assetClassification';
    const groupList = grouping === 'Department' ? DEPARTMENTS : ASSET_CLASSIFICATIONS;

    mockAssetData.forEach(asset => {
      const key = asset[groupKey as keyof typeof asset] as string;
      if (key) {
        const existing = dataMap.get(key) || { count: 0, totalValue: 0 };
        existing.count += 1;
        existing.totalValue += asset.purchaseValue || 0;
        dataMap.set(key, existing);
      }
    });

    return Array.from(dataMap.entries()).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [grouping]);
  
  const totalValueOverall = summaryData.reduce((sum, item) => sum + item.totalValue, 0);

  const chartData = summaryData.map(item => ({
      name: item.name,
      value: item.totalValue,
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Value Summary Report"
        description="Analyzes total asset purchase value by Department or Category."
        actions={
          <>
            <Button variant="outline" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
            </Button>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" /> Export PDF
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
                 <CardTitle className="flex items-center"><DollarSign className="w-5 h-5 mr-2 text-primary"/>Capex Allocation Analysis</CardTitle>
                <CardDescription>View total asset purchase value grouped by your selection.</CardDescription>
            </div>
             <Select value={grouping} onValueChange={(val) => setGrouping(val as GroupingType)}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Department">Group by Department</SelectItem>
                <SelectItem value="Category">Group by Category</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="overflow-x-auto border rounded-md">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{grouping}</TableHead>
                    <TableHead className="text-right">Asset Count</TableHead>
                    <TableHead className="text-right">Total Purchase Value (INR)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {summaryData.map((row) => (
                    <TableRow key={row.name}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                        <TableCell className="text-right">{currencyFormatter.format(row.totalValue)}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                 <TableFooter>
                    <TableRow>
                    <TableCell colSpan={2} className="text-right font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">{currencyFormatter.format(totalValueOverall)}</TableCell>
                    </TableRow>
                </TableFooter>
                </Table>
            </div>
             <div>
                <SampleBarChart 
                    data={chartData}
                    title={`Asset Value by ${grouping}`}
                    description="Visual representation of capex allocation."
                    dataKeyX="name"
                    dataKeyY="value"
                />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
