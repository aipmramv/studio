// src/app/(app)/administration/asset-groupings/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";

const MOCK_GROUPINGS = ["Project Phoenix", "General IT Pool", "Elevator Test Kit A", "R&D Cost Center"];

export default function AssetGroupingMasterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Grouping Master"
        description="Manages logical groupings of assets (by Project, Pool, Kit, Cost Center)."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Grouping
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Groupings</CardTitle>
          <CardDescription>
            This enables bulk actions, project allocations, and rollup reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grouping Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_GROUPINGS.map((name) => (
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
              <TableCaption>{MOCK_GROUPINGS.length} grouping(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
