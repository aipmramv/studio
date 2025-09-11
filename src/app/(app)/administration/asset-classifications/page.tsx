// src/app/(app)/administration/asset-classifications/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { ASSET_CLASSIFICATIONS } from "@/lib/constants";

export default function AssetClassificationMasterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Classification Master"
        description="Standardizes asset categories (e.g., IT, Lab, Furniture, Machinery)."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Classification
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Classifications</CardTitle>
          <CardDescription>
            This ensures consistent reporting, helps apply depreciation & lifecycle rules, and avoids duplication.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Classification Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ASSET_CLASSIFICATIONS.map((name) => (
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
              <TableCaption>{ASSET_CLASSIFICATIONS.length} classification(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
