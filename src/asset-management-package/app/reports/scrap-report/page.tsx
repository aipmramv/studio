// src/app/(app)/reports/scrap-report/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Recycle, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockAssetData } from "@/lib/mock-asset-data";
import type { AssetManagementFormData } from "@/lib/schemas";

export default function ScrapReportPage() {
  const { toast } = useToast();
  const scrappedAssets = mockAssetData.filter(a => a.currentStatus === 'Scrapped');
  
  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing scrap register for ${format} export. This is a mock action.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scrap Register Report"
        description="A log of all assets that have been marked for scrap, including their disposal details."
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
          <CardTitle className="flex items-center"><Recycle className="w-5 h-5 mr-2 text-primary"/>Scrapped Assets Log</CardTitle>
          <CardDescription>This report details all assets that have completed the scrap lifecycle.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Scrap DC No.</TableHead>
                  <TableHead>Scrap DC Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Disposal Proof</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrappedAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                    <TableCell>{asset.assetDescription}</TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell>DC-SCRAP-2024-001</TableCell> {/* Mock Data */}
                    <TableCell>{asset.statusChangedOn ? format(new Date(asset.statusChangedOn), "dd-MMM-yyyy") : 'N/A'}</TableCell>
                    <TableCell>End of Life</TableCell> {/* Mock Data */}
                    <TableCell>
                      <Button variant="link" size="sm" className="h-auto p-0">View Proof</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{scrappedAssets.length} scrapped assets recorded.</TableCaption>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
