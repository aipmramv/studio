// src/app/(app)/stores/material-receipt/list/page.tsx
"use client";

import * as React from "react";
import Link from 'next/link';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, FileText, Truck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { mockReceiptsData, type MaterialReceipt, mockInventoryData } from "@/lib/mock-inventory-data";
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
import { MaterialReceiptForm } from "@/components/forms/MaterialReceiptForm";
import { type MaterialReceiptFormData } from "@/lib/schemas";
import { format } from "date-fns";

export default function MaterialReceiptListPage() {
  const [receipts, setReceipts] = React.useState<MaterialReceipt[]>(mockReceiptsData);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingReceipt, setEditingReceipt] = React.useState<MaterialReceipt | null>(null);
  const [receiptToDelete, setReceiptToDelete] = React.useState<MaterialReceipt | null>(null);
  const { toast } = useToast();

  const openEditDialog = (receipt: MaterialReceipt) => {
    setEditingReceipt(receipt);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirmation = (receipt: MaterialReceipt) => {
    setReceiptToDelete(receipt);
  };

  const executeDelete = () => {
    if (!receiptToDelete) return;

    // Simulate returning items from stock (more complex in reality)
    receiptToDelete.items.forEach(receiptItem => {
      const inventoryIndex = mockInventoryData.findIndex(inv => inv.id === receiptItem.materialId);
      if (inventoryIndex !== -1) {
        mockInventoryData[inventoryIndex].quantityOnHand -= receiptItem.quantity; // Decrease stock
      }
    });

    setReceipts(prev => prev.filter(rec => rec.id !== receiptToDelete.id));
    toast({ title: "Receipt Deleted", description: `Receipt record ${receiptToDelete.id} and its stock adjustments have been reverted.` });
    setReceiptToDelete(null);
  };

  const handleEditSave = (data: MaterialReceiptFormData) => {
    if (!editingReceipt) return;
    
    // In a real app, handling stock adjustment for edits is complex.
    // For this mock, we'll just update the non-item details.
    const updatedReceipt: MaterialReceipt = { 
      ...editingReceipt, 
      ...data, 
      receiptDate: format(data.receiptDate, "yyyy-MM-dd"),
    };
    setReceipts(prev => prev.map(rec => (rec.id === editingReceipt.id ? updatedReceipt : rec)));
    toast({ title: "Material Receipt Updated", description: `Receipt from ${data.vendorName} has been updated.` });
    
    setIsEditDialogOpen(false);
    setEditingReceipt(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Receipt Log"
        description="Record and manage incoming materials into various store locations."
        actions={
          <Button asChild>
            <Link href="/stores/material-receipt/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Material Receipt
            </Link>
          </Button>
        }
      />

      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
        setIsEditDialogOpen(isOpen);
        if (!isOpen) setEditingReceipt(null);
      }}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Material Receipt</DialogTitle>
            <DialogDescription>
             Update the details for this material receipt.
            </DialogDescription>
          </DialogHeader>
          <MaterialReceiptForm
            isEditing={true}
            initialData={editingReceipt}
            onSave={handleEditSave}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {receiptToDelete && (
        <AlertDialog open={!!receiptToDelete} onOpenChange={() => setReceiptToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete receipt {receiptToDelete.id}? This will revert the stock quantities and cannot be undone.
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
          <CardTitle>Receipts List</CardTitle>
          <CardDescription>Log of all materials received into various store locations. You can add new receipts or view details of existing ones.</CardDescription>
        </CardHeader>
        <CardContent>
          {receipts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>GRN / PO</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-medium">{receipt.id}</TableCell>
                    <TableCell>
                      {receipt.grnNumber && <p className="text-xs flex items-center"><Truck className="w-3 h-3 mr-1 text-muted-foreground" />GRN: {receipt.grnNumber}</p>}
                      {receipt.poNumber && <p className="text-xs flex items-center"><FileText className="w-3 h-3 mr-1 text-muted-foreground" />PO: {receipt.poNumber}</p>}
                      {!receipt.grnNumber && !receipt.poNumber && "N/A"}
                    </TableCell>
                    <TableCell>{receipt.vendorName}</TableCell>
                    <TableCell>{receipt.receiptDate}</TableCell>
                    <TableCell>{receipt.storeLocation}</TableCell>
                    <TableCell className="text-right">{receipt.totalItems}</TableCell>
                    <TableCell>
                      <Badge variant={receipt.status === "Received" ? "default" : "secondary"}>{receipt.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => openEditDialog(receipt)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(receipt)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{receipts.length} material receipt(s) logged.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No material receipts found. Click "New Material Receipt" to log one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}