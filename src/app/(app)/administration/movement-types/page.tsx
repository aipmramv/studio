// src/app/(app)/administration/movement-types/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { MOVEMENT_TYPES } from "@/lib/constants";

export default function MovementTypeMasterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Movement Type Master"
        description="Defines allowed movement flows (TT ↔ ITEC, ITEC → Site, Calibration, Scrap)."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Movement Type
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Movement Types</CardTitle>
          <CardDescription>
            This list enforces consistent movement tracking and reporting across the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Movement Type Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOVEMENT_TYPES.map((name) => (
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
              <TableCaption>{MOVEMENT_TYPES.length} movement type(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
