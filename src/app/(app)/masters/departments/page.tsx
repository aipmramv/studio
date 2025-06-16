
// src/app/(app)/masters/departments/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DEPARTMENTS } from "@/lib/constants";

export default function DepartmentsMasterPage() {
  const [departments, setDepartments] = React.useState(DEPARTMENTS);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Departments Master"
        description="Manage organizational departments."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Department
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Departments</CardTitle>
        </CardHeader>
        <CardContent>
          {departments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept}>
                    <TableCell className="font-medium">{dept}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" disabled>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No departments found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
