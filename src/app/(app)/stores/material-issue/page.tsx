
// src/app/(app)/stores/material-issue/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, PackageMinus, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface MaterialIssue {
  issueId: string;
  requestCode?: string; // Optional: Link to a Material Request if applicable
  issuedTo: string; // Department or Person
  issueDate: string;
  storeLocation: string;
  totalItems: number;
  purpose: string;
}

const mockIssues: MaterialIssue[] = [
  { issueId: "ISS001", requestCode: "MRQ050", issuedTo: "Production Line 2", issueDate: "2024-07-21", storeLocation: "Central Warehouse Alpha", totalItems: 3, purpose: "Scheduled Production" },
  { issueId: "ISS002", issuedTo: "Maintenance Team B", issueDate: "2024-07-23", storeLocation: "Sub-Store Gamma", totalItems: 8, purpose: "Urgent Repair" },
];


export default function MaterialIssuePage() {
  const [issues, setIssues] = React.useState<MaterialIssue[]>(mockIssues);
  // Future: Form for new material issue, integration with material requests.

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Issue Log"
        description="Record and manage materials issued from various stores."
        actions={
          <Button>
            <PackageMinus className="w-4 h-4 mr-2" /> New Material Issue
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Issue List</CardTitle>
          <CardDescription>Log of all materials issued from stores.</CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Request Code</TableHead>
                  <TableHead>Issued To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.issueId}>
                    <TableCell className="font-medium">{issue.issueId}</TableCell>
                    <TableCell>{issue.requestCode || "N/A"}</TableCell>
                    <TableCell className="flex items-center"><Users className="w-4 h-4 mr-2 text-muted-foreground" />{issue.issuedTo}</TableCell>
                    <TableCell>{issue.issueDate}</TableCell>
                    <TableCell>{issue.storeLocation}</TableCell>
                    <TableCell className="text-right">{issue.totalItems}</TableCell>
                    <TableCell>{issue.purpose}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="View Details">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{issues.length} material issue(s) logged.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No material issues found. Click "New Material Issue" to log one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
