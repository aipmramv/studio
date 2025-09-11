
// src/app/(app)/reports/finance-report/page.tsx
"use client";

import * as React from "react";
import { format, differenceInYears } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Database, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockAssetData } from "@/lib/mock-asset-data";
import type { AssetManagementFormData } from "@/lib/schemas";

export default function FinanceReportPage() {
  const { toast } = useToast();
  
  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing finance report for ${format} export. This is a mock action.`,
    });
  };
  
  const currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Depreciation & Finance Report"
        description="Provides financial data including purchase value, capitalization dates, and calculated depreciation."
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
          <CardTitle className="flex items-center"><Database className="w-5 h-5 mr-2 text-primary"/>Asset Financial Overview</CardTitle>
          <CardDescription>All values are in INR. Depreciation is calculated using Straight-Line Method for illustrative purposes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset No.</TableHead>
                  <TableHead>KM No.</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Capitalization Date</TableHead>
                  <TableHead>Asset Life (Yrs)</TableHead>
                  <TableHead className="text-right">Purchase Value</TableHead>
                  <TableHead className="text-right">Annual Depreciation</TableHead>
                  <TableHead className="text-right">Accumulated Depreciation</TableHead>
                  <TableHead className="text-right">Written Down Value (WDV)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssetData.map((asset) => {
                  const purchaseValue = asset.purchaseValue || 0;
                  const life = asset.lifecycleYears || 1;
                  const annualDepreciation = purchaseValue / life;
                  const capDate = asset.capitalizationDate ? new Date(asset.capitalizationDate) : new Date();
                  const yearsSinceCap = differenceInYears(new Date(), capDate);
                  const accumulatedDepreciation = Math.min(annualDepreciation * yearsSinceCap, purchaseValue);
                  const wdv = purchaseValue - accumulatedDepreciation;

                  return (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        {asset.assetNumber}
                      </TableCell>
                      <TableCell>{asset.kmNumber}</TableCell>
                      <TableCell>{asset.assetDescription}</TableCell>
                      <TableCell>{format(capDate, "dd-MMM-yyyy")}</TableCell>
                      <TableCell>{life}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(purchaseValue)}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(annualDepreciation)}</TableCell>
                      <TableCell className="text-right">{currencyFormatter.format(accumulatedDepreciation)}</TableCell>
                      <TableCell className="text-right font-semibold">{currencyFormatter.format(wdv)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableCaption>{mockAssetData.length} assets listed.</TableCaption>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
