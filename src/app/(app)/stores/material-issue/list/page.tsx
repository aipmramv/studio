// src/app/(app)/stores/material-issue/list/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import Link from 'next/link';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { mockIssuesData, type MaterialIssue, mockInventoryData } from "@/lib/mock-inventory-data";
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
import { MaterialIssueForm } from "@/components/forms/MaterialIssueForm";
import { type MaterialIssueFormData } from "@/lib/schemas";

export default function MaterialIssueListPage() {
  const [issues, setIssues] = React.useState<MaterialIssue[]>(mockIssuesData);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [editingIssue, setEditingIssue] = React.useState<MaterialIssue | null>(null);
  const [issueToDelete, setIssueToDelete] = React.useState<MaterialIssue | null>(null);
  const { toast } = useToast();

  const openEditDialog = (issue: MaterialIssue) => {
    setEditingIssue(issue);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirmation = (issue: MaterialIssue) => {
    setIssueToDelete(issue);
  };

  const executeDelete = () => {
    if (!issueToDelete) return;

    // Simulate returning items to stock
    issueToDelete.items.forEach(issuedItem => {
        const inventoryIndex = mockInventoryData.findIndex(inv => inv.id === issuedItem.materialId);
        if (inventoryIndex !== -1) {
            mockInventoryData[inventoryIndex].quantityOnHand += issuedItem.quantity;
        }
    });

    setIssues(prev => prev.filter(iss => iss.issueId !== issueToDelete.id));
    toast({ title: "Material Issue Deleted", description: `Issue record ${issueToDelete.id} and its stock adjustments have been reverted.` });
    setIssueToDelete(null);
  };

  const handleEditSave = (data: MaterialIssueFormData) => {
    if (!editingIssue) return;
    // Logic for editing an issue is complex (reverting stock, then re-issuing)
    // For this mock, we'll just update the details without stock changes.
    const updatedIssue: MaterialIssue = {
      ...editingIssue,
      ...data,
      issueDate: format(data.issueDate, "yyyy-MM-dd"),
      // Items are not editable in this simplified version to avoid stock complexity
    };
    setIssues(prev => prev.map(iss => (iss.issueId === editingIssue.issueId ? updatedIssue : iss)));
    toast({ title: "Material Issue Updated", description: `Issue record ${data.issuedTo} has been updated.` });
    
    setIsEditDialogOpen(false);
    setEditingIssue(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Issue Log"
        description="Record and manage materials issued from various stores to departments or personnel."
        actions={
          <Button asChild>
            <Link href="/stores/material-issue/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Material Issue
            </Link>
          </Button>
        }
      />
      
      <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
        setIsEditDialogOpen(isOpen);
        if (!isOpen) setEditingIssue(null);
      }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Material Issue</DialogTitle>
            <DialogDescription>
              Update the details for this material issue.
            </DialogDescription>
          </DialogHeader>
          <MaterialIssueForm
            isEditing={true}
            initialData={editingIssue}
            onSave={handleEditSave}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
      
      {issueToDelete && (
        <AlertDialog open={!!issueToDelete} onOpenChange={() => setIssueToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete issue record {issueToDelete.id}? This will revert the stock quantities and cannot be undone.
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
          <CardTitle>Issue List</CardTitle>
          <CardDescription>Log of all materials issued from stores. You can add new issues or view details of existing ones.</CardDescription>
        </CardHeader>
        <CardContent>
          {issues.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue ID</TableHead>
                  <TableHead>Issued To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow key={issue.issueId}>
                    <TableCell className="font-medium">{issue.issueId}</TableCell>
                    <TableCell className="flex items-center"><Users className="w-4 h-4 mr-2 text-muted-foreground" />{issue.issuedTo}</TableCell>
                    <TableCell>{issue.issueDate}</TableCell>
                    <TableCell>{issue.storeLocation}</TableCell>
                    <TableCell className="text-right">{issue.totalItems}</TableCell>
                    <TableCell>{issue.purpose}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => openEditDialog(issue)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(issue)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{issues.length} material issue(s) logged.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No material issues found. Click "New Material Issue" to log one.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}