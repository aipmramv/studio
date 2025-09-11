// src/app/(app)/reports/movement-report/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Truck, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Mock Data
const mockMovementData = [
  { id: "MV001", assetNumber: "KONE-RD-OSC-001", dcNumber: "DC20240728-A", type: "Calibration", from: "ITEC Lab", to: "External Calibration", date: "2024-07-28", responsible: "Praveen S." },
  { id: "MV002", assetNumber: "KONE-SITE-LASER-01", dcNumber: "DC20240727-B", type: "ITEC -> Site", from: "ITEC Stores", to: "KONE Site Chennai", date: "2024-07-27", responsible: "Nagaraj V." },
  { id: "MV003", assetNumber: "KONE-RD-LAP-001", dcNumber: "DC20240726-C", type: "TT <> ITEC", from: "TT", to: "ITEC", date: "2024-07-26", responsible: "Ram Kumar" },
  { id: "MV004", assetNumber: "ASSET-004", dcNumber: "DC20240725-D", type: "Scrap", from: "Maintenance Workshop", to: "Scrap Yard", date: "2024-07-25", responsible: "Admin" },
];

export default function MovementReportPage() {
  const { toast } = useToast();
  
  const handleExport = (format: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${format.toUpperCase()}...`,
      description: `Preparing movement report for ${format} export. This is a mock action.`,
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Movement Report"
        description="A detailed report on all asset movements, filterable by type, date range, person, or department."
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
          <CardTitle className="flex items-center"><Truck className="w-5 h-5 mr-2 text-primary"/>Movement Log</CardTitle>
          <CardDescription>This report tracks all physical movements of assets between locations.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="overflow-x-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Number</TableHead>
                  <TableHead>DC Number</TableHead>
                  <TableHead>Movement Type</TableHead>
                  <TableHead>From Location</TableHead>
                  <TableHead>To Location</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Responsible Person</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockMovementData.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell className="font-medium">{movement.assetNumber}</TableCell>
                    <TableCell>{movement.dcNumber}</TableCell>
                    <TableCell><Badge variant="secondary">{movement.type}</Badge></TableCell>
                    <TableCell>{movement.from}</TableCell>
                    <TableCell>{movement.to}</TableCell>
                    <TableCell>{format(new Date(movement.date), "dd-MMM-yyyy")}</TableCell>
                    <TableCell>{movement.responsible}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{mockMovementData.length} movements recorded.</TableCaption>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
