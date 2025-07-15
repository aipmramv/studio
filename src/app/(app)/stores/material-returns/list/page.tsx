// src/app/(app)/stores/material-returns/list/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import Link from 'next/link';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Undo2, Users, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockReturnsData, type MaterialReturn, mockInventoryData } from "@/lib/mock-inventory-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MaterialReturnForm } from "@/components/forms/MaterialReturnForm";
import { type MaterialReturnFormData } from "@/lib/schemas";

export default function MaterialReturnListPage() {
  const [returns, setReturns] = React.useState<MaterialReturn[]>(mockReturnsData);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingReturn, setEditingReturn] = React.useState<MaterialReturn | null>(null);
  const [returnToDelete, setReturnToDelete] = React.useState<MaterialReturn | null>(null);
  const { toast } = useToast();

  const openEditDialog = (itemReturn: MaterialReturn) => {
    setEditingReturn(itemReturn);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirmation = (itemReturn: MaterialReturn) => {
    setReturnToDelete(itemReturn);
  };

  const executeDelete = () => {
    if (!returnToDelete) return;

    // Simulate returning items to the department (subtracting from inventory)
    returnToDelete.items.forEach(returnedItem => {
        const inventoryIndex = mockInventoryData.findIndex(inv => inv.id === returnedItem.materialId);
        if (inventoryIndex !== -1) {
            mockInventoryData[inventoryIndex].quantityOnHand -= returnedItem.quantity;
        }
    });

    setReturns(prev => prev.filter(ret => ret.id !== returnToDelete.id));
    toast({ title: "Material Return Deleted", description: `Return record ${returnToDelete.id} and its stock adjustments have been reverted.` });
    setReturnToDelete(null);
  };

  const handleEditSave = (data: MaterialReturnFormData) => {
    if (!editingReturn) return;
    
    // Simplified update for mock purposes
    const updatedReturn: MaterialReturn = { 
        ...editingReturn,
        ...data,
        returnDate: format(data.returnDate, "yyyy-MM-dd"),
    };
    setReturns(prev => prev.map(ret => (ret.id === editingReturn.id ? updatedReturn : ret)));
    toast({ title: "Material Return Updated", description: `Return from ${data.returnedBy} has been updated.` });
    
    setIsEditDialogOpen(false);
    setEditingReturn(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Returns Log"
        description="Record and manage materials returned to various store locations."
        actions={
          <Button asChild>
            <Link href="/stores/material-returns/new">
                <PlusCircle className="w-4 h-4 mr-2" /> New Material Return
            </Link>
          </Button>
        }
      />
      
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
        setIsEditDialogOpen(isOpen);
        if (!isOpen) setEditingReturn(null);
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Material Return</DialogTitle>
            <DialogDescription>
              Update the details for this material return.
            </DialogDescription>
          </DialogHeader>
          <MaterialReturnForm
            isEditing={true}
            initialData={editingReturn}
            onSave={handleEditSave}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

       {returnToDelete && (
        <AlertDialog open={!!returnToDelete} onOpenChange={() => setReturnToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete return record {returnToDelete.id}? This will revert the stock quantities and cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Returns List</CardTitle>
          <CardDescription>Log of all materials returned to stores. You can add new return entries or view details.</CardDescription>
        </CardHeader>
        <CardContent>
          {returns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Orig. Issue</TableHead>
                  <TableHead>Returned By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((itemReturn) => (
                  <TableRow key={itemReturn.id}>
                    <TableCell className="font-medium">{itemReturn.id}</TableCell>
                    <TableCell>{itemReturn.originalIssueId || "N/A"}</TableCell>
                    <TableCell className="flex items-center"><Users className="w-4 h-4 mr-2 text-muted-foreground" />{itemReturn.returnedBy}</TableCell>
                    <TableCell>{itemReturn.returnDate}</TableCell>
                    <TableCell>{itemReturn.storeLocation}</TableCell>
                    <TableCell className="text-right">{itemReturn.totalItems}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          itemReturn.condition === "Good" ? "default" :
                          itemReturn.condition === "Damaged" ? "destructive" :
                          "secondary"
                        }
                      >
                        {itemReturn.condition}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => openEditDialog(itemReturn)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(itemReturn)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{returns.length} material return(s) logged.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No material returns found. Click "New Material Return" to log one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}