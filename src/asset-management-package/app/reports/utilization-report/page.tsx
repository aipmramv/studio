// src/app/(app)/reports/utilization-report/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Activity, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockAssetData } from "@/lib/mock-asset-data";
import { Badge } from "@/components/ui/badge";

export default function UtilizationReportPage() {
  const { toast } = useToast();
  
  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing utilization report for ${format} export. This is a mock action.`,
    });
  };

  const getUtilizationBadge = (days: number) => {
    if (days >= 5) return <Badge variant="default">High</Badge>;
    if (days >= 2) return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Utilization Report"
        description="Identifies under-utilized assets based on weekly usage frequency and check-in/out logs."
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
          <CardTitle className="flex items-center"><Activity className="w-5 h-5 mr-2 text-primary"/>Asset Usage Overview</CardTitle>
          <CardDescription>This report helps identify assets that are not being used to their full potential.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Current User</TableHead>
                  <TableHead>Weekly Usage (Days)</TableHead>
                  <TableHead>Utilization Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssetData.filter(a => a.weeklyUsageFrequency !== undefined).map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                    <TableCell>{asset.assetDescription}</TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>{asset.currentUser}</TableCell>
                    <TableCell>{asset.weeklyUsageFrequency}</TableCell>
                    <TableCell>{getUtilizationBadge(asset.weeklyUsageFrequency || 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{mockAssetData.filter(a => a.weeklyUsageFrequency !== undefined).length} assets with usage data.</TableCaption>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
