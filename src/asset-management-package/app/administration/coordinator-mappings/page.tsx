// src/app/(app)/administration/coordinator-mappings/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MOCK_MAPPINGS = [
    { id: "map1", spoc: "Prem Kumar", department: "Finance", team: "N/A" },
    { id: "map2", spoc: "Praveen S.", department: "Production", team: "N/A" },
    { id: "map3", spoc: "Chandrasekar R.", department: "R&D", team: "Elevator Systems" },
    { id: "map4", spoc: "Nagaraj V.", department: "Maintenance", team: "N/A" },
];

export default function CoordinatorMappingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Coordinator (SPOC) Mapping"
        description="Maps Single Point of Contacts (SPOCs) to departments or teams."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Mapping
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Mappings</CardTitle>
          <CardDescription>
            This ensures correct routing of ownership requests, approvals, and notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SPOC Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Team / Tribe</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_MAPPINGS.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell className="font-medium">{mapping.spoc}</TableCell>
                    <TableCell><Badge>{mapping.department}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{mapping.team}</Badge></TableCell>
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
              <TableCaption>{MOCK_MAPPINGS.length} mapping(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
