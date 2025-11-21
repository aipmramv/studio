// src/app/(app)/reports/incomplete-records/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { FileWarning, FileText, FileSpreadsheet, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockAssetData } from "@/lib/mock-asset-data";
import type { AssetManagementFormData } from "@/lib/schemas";
import Link from "next/link";

export default function IncompleteRecordsReportPage() {
  const { toast } = useToast();
  
  const incompleteAssets = React.useMemo(() => {
    return mockAssetData.map(asset => {
      const missingFields: string[] = [];
      if (!asset.productSerialNo) missingFields.push("Serial No.");
      if (!asset.assetCoordinator) missingFields.push("Coordinator");
      if (!asset.location) missingFields.push("Location");
      if (!asset.attachments?.photo) missingFields.push("Photo");
      return { ...asset, missingFields };
    }).filter(asset => asset.missingFields.length > 0);
  }, []);

  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing incomplete records report for ${format} export. This is a mock action.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Incomplete Records Report"
        description="Highlights assets with missing mandatory fields to ensure data quality."
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
          <CardTitle className="flex items-center"><FileWarning className="w-5 h-5 mr-2 text-primary"/>Assets with Incomplete Data</CardTitle>
          <CardDescription>The following assets are missing one or more mandatory data fields. Please update them to ensure data integrity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Missing Fields</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incompleteAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                    <TableCell>{asset.assetDescription}</TableCell>
                    <TableCell className="text-destructive font-medium">{asset.missingFields.join(', ')}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/asset-management/list`}>
                          <Edit className="w-3 h-3 mr-1" /> View/Edit
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{incompleteAssets.length} assets with incomplete records found.</TableCaption>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
