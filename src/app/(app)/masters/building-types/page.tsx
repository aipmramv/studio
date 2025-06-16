
// src/app/(app)/masters/building-types/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BUILDING_TYPES } from "@/lib/constants";

export default function BuildingTypesMasterPage() {
  const [buildingTypes, setBuildingTypes] = React.useState(BUILDING_TYPES);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Building Types Master"
        description="Manage building and location types."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Building Type
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Building Types</CardTitle>
        </CardHeader>
        <CardContent>
          {buildingTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buildingTypes.map((type) => (
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
            <p className="text-muted-foreground">No building types found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
