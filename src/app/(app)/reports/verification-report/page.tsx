// src/app/(app)/reports/verification-report/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, FileSpreadsheet, FileText, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockAssetData } from "@/lib/mock-asset-data";

export default function VerificationReportPage() {
  const { toast } = useToast();
  
  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing verification report for ${format} export. This is a mock action.`,
    });
  };
  
  const getStatusBadgeVariant = (status?: string) => {
    if (!status) return "outline";
    if (status === "Verified") return "default";
    if (status === "Pending") return "secondary";
    if (status === "Discrepancy") return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Verification Report"
        description="Tracks verification history, pending verifications, and attached photo evidence."
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
          <CardTitle className="flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-primary"/>Verification Status Log</CardTitle>
          <CardDescription>This report shows the latest verification status for all assets.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Verification Status</TableHead>
                  <TableHead>Last Verified On</TableHead>
                  <TableHead>Photo Attached?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAssetData.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.assetNumber}</TableCell>
                    <TableCell>{asset.assetDescription}</TableCell>
                    <TableCell>{asset.department}</TableCell>
                    <TableCell><Badge variant={getStatusBadgeVariant(asset.verificationStatus)}>{asset.verificationStatus || "N/A"}</Badge></TableCell>
                    <TableCell>{asset.verifiedOn ? format(new Date(asset.verifiedOn), "dd-MMM-yyyy") : "N/A"}</TableCell>
                    <TableCell>
                      {asset.attachments?.photo ? 
                        <Badge variant="default"><Camera className="w-3 h-3 mr-1"/>Yes</Badge> : 
                        <Badge variant="secondary">No</Badge>
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{mockAssetData.length} assets found.</TableCaption>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
