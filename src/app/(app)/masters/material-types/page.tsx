
// src/app/(app)/masters/material-types/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MATERIAL_TYPES } from "@/lib/constants";

export default function MaterialTypesMasterPage() {
  // In a real app, you'd fetch this data and have CRUD operations
  const [materialTypes, setMaterialTypes] = React.useState(MATERIAL_TYPES);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Types Master"
        description="Manage the types of materials used in the system."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Material Type
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Material Types</CardTitle>
        </CardHeader>
        <CardContent>
          {materialTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialTypes.map((type) => (
                  <TableRow key={type}>
                    <TableCell className="font-medium">{type}</TableCell>
                    <TableCell className="text-right">
                      {/* Placeholder for Edit/Delete buttons */}
                      <Button variant="ghost" size="sm" disabled>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">No material types found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
