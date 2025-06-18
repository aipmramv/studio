
// src/app/(app)/stores/material-returns/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Undo2, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface MaterialReturn {
  returnId: string;
  originalIssueId?: string;
  returnedBy: string; // Department or Person
  returnDate: string;
  storeLocation: string;
  totalItems: number;
  reason: string;
  condition: "Good" | "Damaged" | "Requires Inspection";
}

const mockReturns: MaterialReturn[] = [
  { returnId: "RET001", originalIssueId: "ISS001", returnedBy: "Production Line 2", returnDate: "2024-07-24", storeLocation: "Central Warehouse Alpha", totalItems: 1, reason: "Excess material", condition: "Good" },
  { returnId: "RET002", returnedBy: "Maintenance Team B", returnDate: "2024-07-25", storeLocation: "Sub-Store Gamma", totalItems: 2, reason: "Wrong item issued", condition: "Requires Inspection" },
];


export default function MaterialReturnsPage() {
  const [returns, setReturns] = React.useState<MaterialReturn[]>(mockReturns);
  // Future: Form for new material return.

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Returns Log"
        description="Record and manage materials returned to various store locations."
        actions={
          <Button>
            <Undo2 className="w-4 h-4 mr-2" /> New Material Return
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Returns List</CardTitle>
          <CardDescription>Log of all materials returned to stores. You can add new return entries or view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {returns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Orig. Issue</TableHead>
                  <TableHead>Returned By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((itemReturn) => (
                  <TableRow key={itemReturn.returnId}>
                    <TableCell className="font-medium">{itemReturn.returnId}</TableCell>
                    <TableCell>{itemReturn.originalIssueId || "N/A"}</TableCell>
                    <TableCell className="flex items-center"><Users className="w-4 h-4 mr-2 text-muted-foreground" />{itemReturn.returnedBy}</TableCell>
                    <TableCell>{itemReturn.returnDate}</TableCell>
                    <TableCell>{itemReturn.storeLocation}</TableCell>
                    <TableCell className="text-right">{itemReturn.totalItems}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          itemReturn.condition === "Good" ? "default" :
                          itemReturn.condition === "Damaged" ? "destructive" :
                          "secondary"
                        }
                      >
                        {itemReturn.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="View Details">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{returns.length} material return(s) logged.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No material returns found. Click "New Material Return" to log one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
