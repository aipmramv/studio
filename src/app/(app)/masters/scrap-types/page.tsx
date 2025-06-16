
// src/app/(app)/masters/scrap-types/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SCRAP_TYPES } from "@/lib/constants";

export default function ScrapTypesMasterPage() {
  const [scrapTypes, setScrapTypes] = React.useState(SCRAP_TYPES);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scrap Types Master"
        description="Manage the types of scrap materials."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Scrap Type
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Scrap Types</CardTitle>
        </CardHeader>
        <CardContent>
          {scrapTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrapTypes.map((type) => (
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
            <p className="text-muted-foreground">No scrap types found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
