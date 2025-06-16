
// src/app/(app)/stores/audit/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, SearchCheck, FileText, CalendarCheck2 } from "lucide-react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface StoreAudit {
  auditId: string;
  storeName: string;
  auditDate: string;
  auditor: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Pending Review";
  discrepanciesFound: number;
}

const mockAudits: StoreAudit[] = [
  { auditId: "AUD001", storeName: "Central Warehouse Alpha", auditDate: "2024-08-01", auditor: "Admin User", status: "Scheduled", discrepanciesFound: 0 },
  { auditId: "AUD002", storeName: "Sub-Store Gamma", auditDate: "2024-07-15", auditor: "Jane Auditor", status: "Completed", discrepanciesFound: 3 },
];

export default function StoresAuditPage() {
  const [audits, setAudits] = React.useState<StoreAudit[]>(mockAudits);
  // Future: Form for starting new audit, checklist, recording findings.

  return (
    <div className="space-y-8">
      <PageHeader
        title="Stores Audit Log"
        description="Schedule, conduct, and review store audit records for inventory accuracy and compliance."
        actions={
          <Button>
            <SearchCheck className="w-4 h-4 mr-2" /> Start New Audit
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Audit Records</CardTitle>
          <CardDescription>List of all store audits and their status. You can start a new audit or review existing ones.</CardDescription>
        </CardHeader>
        <CardContent>
          {audits.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Audit ID</TableHead>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Audit Date</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead className="text-right">Discrepancies</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audits.map((audit) => (
                  <TableRow key={audit.auditId}>
                    <TableCell className="font-medium">{audit.auditId}</TableCell>
                    <TableCell>{audit.storeName}</TableCell>
                    <TableCell className="flex items-center"><CalendarCheck2 className="w-4 h-4 mr-2 text-muted-foreground" />{audit.auditDate}</TableCell>
                    <TableCell>{audit.auditor}</TableCell>
                    <TableCell className="text-right">{audit.discrepanciesFound}</TableCell>
                    <TableCell>
                       <Badge 
                        variant={
                          audit.status === "Completed" ? "default" :
                          audit.status === "In Progress" ? "secondary" : // Example, could use an accent color
                          "outline"
                        }
                        className="capitalize"
                      >
                        {audit.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="View Audit Details">
                        <FileText className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{audits.length} store audit(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No store audits scheduled or completed. Click "Start New Audit" to begin.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

