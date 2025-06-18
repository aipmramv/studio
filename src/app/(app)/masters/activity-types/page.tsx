
// src/app/(app)/masters/activity-types/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ACTIVITY_TYPES_WORK_PERMIT } from "@/lib/constants";

export default function ActivityTypesMasterPage() {
  const [activityTypes, setActivityTypes] = React.useState(ACTIVITY_TYPES_WORK_PERMIT);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activity Types Master (Work Permit)"
        description="Manage activity types for work permits."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Activity Type
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Activity Types</CardTitle>
        </CardHeader>
        <CardContent>
          {activityTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityTypes.map((type) => (
                  <TableRow key={type}>
                    <TableCell className="font-medium">{type}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" disabled>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No activity types found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
