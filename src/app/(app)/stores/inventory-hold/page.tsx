// src/app/(app)/stores/inventory-hold/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { LockOpen, Package, Warehouse, Calendar, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockInventoryData } from "@/lib/mock-inventory-data";
import type { InventoryItem } from "@/lib/mock-inventory-data";

export default function InventoryHoldPage() {
  // Use a version state to force re-renders when the underlying mock data changes.
  const [version, setVersion] = React.useState(0);
  const { toast } = useToast();

  // This state is for managing the selection in the table UI.
  const [selectedRows, setSelectedRows] = React.useState<Record<string, boolean>>({});

  const heldItems = React.useMemo(() => {
    // Re-run this memo when the version changes.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    version;
    return mockInventoryData.filter(item => item.heldQuantity && item.heldQuantity > 0);
  }, [version]);

  const handleReleaseItems = () => {
    const itemsToRelease = Object.keys(selectedRows).filter(id => selectedRows[id]);
    if (itemsToRelease.length === 0) {
      toast({ title: "No items selected", description: "Please select items to release.", variant: "destructive" });
      return;
    }

    // In a real app, this would be an API call. Here, we mutate the mock data.
    mockInventoryData.forEach(item => {
      if (itemsToRelease.includes(item.id)) {
        item.heldQuantity = 0;
        item.holdReason = undefined;
        item.holdUntil = undefined;
      }
    });

    toast({
      title: "Items Released",
      description: `${itemsToRelease.length} item(s) have been released back to available stock.`,
    });

    // Clear selection and force a re-render of the component.
    setSelectedRows({});
    setVersion(v => v + 1);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedRows: Record<string, boolean> = {};
    if (checked) {
      heldItems.forEach(item => {
        newSelectedRows[item.id] = true;
      });
    }
    setSelectedRows(newSelectedRows);
  };
  
  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => ({ ...prev, [id]: checked }));
  };
  
  const isAllSelected = heldItems.length > 0 && heldItems.every(item => selectedRows[item.id]);
  const isSomeSelected = heldItems.some(item => selectedRows[item.id]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory on Hold Report"
        description="View and manage all materials currently on hold for specific purposes."
        actions={
          <Button onClick={handleReleaseItems} disabled={!isSomeSelected}>
            <LockOpen className="w-4 h-4 mr-2" /> Release Selected Items
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Held Inventory List</CardTitle>
          <CardDescription>
            This report shows items with quantities reserved or on hold. Select items and use the "Release" button to make them available again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {heldItems.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No items are currently on hold.</p>
          ) : (
            <div className="overflow-x-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                       <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all rows"
                      />
                    </TableHead>
                    <TableHead>Material Name</TableHead>
                    <TableHead><Warehouse className="inline w-4 h-4 mr-1 text-muted-foreground"/>Store Location</TableHead>
                    <TableHead className="text-right">Held Quantity</TableHead>
                    <TableHead><HelpCircle className="inline w-4 h-4 mr-1 text-muted-foreground"/>Hold Reason</TableHead>
                    <TableHead><Calendar className="inline w-4 h-4 mr-1 text-muted-foreground"/>Hold Until</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heldItems.map(item => (
                    <TableRow key={item.id} data-state={selectedRows[item.id] && "selected"}>
                       <TableCell>
                        <Checkbox
                          checked={!!selectedRows[item.id]}
                          onCheckedChange={(checked) => handleSelectRow(item.id, !!checked)}
                          aria-label={`Select row ${item.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.name}
                        <p className="text-xs text-muted-foreground">{item.id}</p>
                      </TableCell>
                      <TableCell>{item.storeLocation}</TableCell>
                      <TableCell className="text-right font-semibold">{item.heldQuantity}</TableCell>
                      <TableCell>{item.holdReason}</TableCell>
                      <TableCell>{item.holdUntil ? format(new Date(item.holdUntil), "dd-MMM-yyyy") : "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>{heldItems.length} item(s) currently on hold.</TableCaption>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
