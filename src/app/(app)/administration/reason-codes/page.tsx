// src/app/(app)/administration/reason-codes/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { REASON_CODES } from "@/lib/constants";

export default function ReasonCodeMasterPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reason Code Master"
        description="Manages standard codes for movement and transaction reasons."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Reason Code
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Reason Codes</CardTitle>
          <CardDescription>
            Using standard codes enables root-cause analysis and eliminates free-text ambiguity.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {REASON_CODES.map((name) => (
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
              <TableCaption>{REASON_CODES.length} reason code(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}
