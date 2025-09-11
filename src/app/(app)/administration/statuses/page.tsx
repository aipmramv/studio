// src/app/(app)/administration/statuses/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { ASSET_STATUSES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default function StatusMasterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Status Master"
        description="Defines asset lifecycle states (e.g., Active, Reserved, Calibration, Scrap)."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Status
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Statuses</CardTitle>
          <CardDescription>
            This master list controls state transitions and powers dashboard snapshots.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ASSET_STATUSES.map((name) => (
                  <TableRow key={name}>
                    <TableCell className="font-medium"><Badge variant="outline">{name}</Badge></TableCell>
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
              <TableCaption>{ASSET_STATUSES.length} status(es) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
