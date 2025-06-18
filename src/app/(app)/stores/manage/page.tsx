
// This file is being replaced by /src/app/(app)/masters/store-locations/page.tsx
// Content will be removed as the functionality is moved.

"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface StoreLocation {
  id: string;
  name: string;
  location: string;
  type: "Main Warehouse" | "Sub-Store" | "Production Floor";
  manager?: string;
}

const mockStores: StoreLocation[] = [
  { id: "STORE001", name: "Central Warehouse Alpha", location: "Block A, Industrial Area", type: "Main Warehouse", manager: "John Doe" },
  { id: "STORE002", name: "Production Line Store 1", location: "KOSMO Building, Floor 2", type: "Production Floor", manager: "Alice Smith" },
  { id: "STORE003", name: "Sub-Store Gamma", location: "Test Tower, Basement", type: "Sub-Store" },
];


export default function ManageStoresPage_DEPRECATED() {
  // This component is deprecated and its functionality moved to /masters/store-locations
  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Stores (DEPRECATED)"
        description="This page has been moved to Masters > Store Locations."
      />
      <Card>
        <CardHeader>
          <CardTitle>Functionality Moved</CardTitle>
          <CardDescription>Please use the 'Store Locations' page under the 'Masters' section in the navigation menu.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-destructive">This page is no longer active.</p>
        </CardContent>
      </Card>
    </div>
  );
}
