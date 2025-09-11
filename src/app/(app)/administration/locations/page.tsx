// src/app/(app)/administration/locations/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { STORE_LOCATIONS } from "@/lib/constants"; 

export default function LocationMasterPage() {

  return (
    <div className="space-y-8">
      <PageHeader
        title="Location Master"
        description="Defines all sites, buildings, floors, and labs where assets can be located."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Location
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><MapPin className="w-5 h-5 mr-2 text-primary" /> Existing Locations</CardTitle>
          <CardDescription>This master data controls asset movements and powers site-based dashboards, preventing free-text entry errors.</CardDescription>
        </CardHeader>
        <CardContent>
          
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STORE_LOCATIONS.map((loc) => (
                  <TableRow key={loc}>
                    <TableCell className="font-medium">{loc}</TableCell>
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
              <TableCaption>{STORE_LOCATIONS.length} location(s) found.</TableCaption>
            </Table>
        
        </CardContent>
      </Card>
    </div>
  );
}
