// src/app/(app)/administration/notification-rules/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MOCK_RULES = [
    { id: "rule1", event: "Return Due", timing: "T-3 Days", recipients: "Custodian, SPOC" },
    { id: "rule2", event: "Calibration Due", timing: "T-7 & T-1 Days", recipients: "Custodian, SPOC, Admin" },
    { id: "rule3", event: "Asset Movement", timing: "Immediate", recipients: "Initiator, Custodian, SPOC" },
    { id: "rule4", event: "Verification Pending", timing: "Weekly", recipients: "SPOC, Admin" },
];

export default function NotificationRuleMasterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Alert/Notification Rule Master"
        description="Defines events and recipients for automated alerts."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Rule
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Notification Rules</CardTitle>
          <CardDescription>
            These rules drive timely alerts, prevent asset loss, and improve compliance.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_RULES.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.event}</TableCell>
                    <TableCell><Badge variant="secondary">{rule.timing}</Badge></TableCell>
                    <TableCell>{rule.recipients}</TableCell>
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
              <TableCaption>{MOCK_RULES.length} rule(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
