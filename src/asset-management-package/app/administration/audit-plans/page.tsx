// src/app/(app)/administration/audit-plans/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MOCK_PLANS = [
    { id: "plan1", name: "Annual IT Asset Audit", frequency: "Annual", rules: "Photo mandatory for laptops" },
    { id: "plan2", name: "Quarterly Lab Equipment Check", frequency: "Quarterly", rules: "Calibration status must be checked" },
    { id: "plan3", name: "High Value Asset Bi-Annual", frequency: "Bi-Annually", rules: "Physical verification by 2 people" },
];

export default function AuditPlanMasterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Verification/Audit Plan Master"
        description="Defines audit frequency and rules (e.g., Annual, Quarterly, Photo mandatory)."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Plan
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Audit Plans</CardTitle>
          <CardDescription>
            These plans ensure compliance and generate verification due alerts.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Rules</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_PLANS.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell><Badge variant="outline">{plan.frequency}</Badge></TableCell>
                    <TableCell>{plan.rules}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm">
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{MOCK_PLANS.length} plan(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
