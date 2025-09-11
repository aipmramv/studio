// src/app/(app)/administration/conditions/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";

const MOCK_CONDITIONS = ["Working", "Needs Repair", "Down", "Good", "Fair", "Poor"];

export default function ConditionMasterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Condition Master"
        description="Defines asset health states (e.g., Working, Needs Repair, Down)."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Condition
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Conditions</CardTitle>
          <CardDescription>
            These statuses enable maintenance triggers and support audit reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Condition Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_CONDITIONS.map((name) => (
                  <TableRow key={name}>
                    <TableCell className="font-medium">{name}</TableCell>
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
              <TableCaption>{MOCK_CONDITIONS.length} condition(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
