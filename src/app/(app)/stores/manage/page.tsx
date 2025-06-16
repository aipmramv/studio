
// src/app/(app)/stores/manage/page.tsx
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


export default function ManageStoresPage() {
  const [stores, setStores] = React.useState<StoreLocation[]>(mockStores);
  // In a real app, CRUD operations for stores would be handled here.

  return (
    <div className="space-y-8">
      <PageHeader
        title="Manage Stores"
        description="Create, view, and manage store locations within the organization."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Store
          </Button>
        }
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Store Locations</CardTitle>
          <CardDescription>List of all configured stores.</CardDescription>
        </CardHeader>
        <CardContent>
          {stores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.id}</TableCell>
                    <TableCell>{store.name}</TableCell>
                    <TableCell className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-muted-foreground" />{store.location}</TableCell>
                    <TableCell><Badge variant="outline">{store.type}</Badge></TableCell>
                    <TableCell>{store.manager || "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Edit Store">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Delete Store" className="text-destructive hover:text-destructive/80">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{stores.length} store location(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No store locations configured yet. Click "Add New Store" to begin.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
