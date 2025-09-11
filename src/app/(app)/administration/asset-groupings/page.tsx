// src/app/(app)/administration/asset-groupings/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const MOCK_GROUPINGS_INIT = ["Project Phoenix", "General IT Pool", "Elevator Test Kit A", "R&D Cost Center"];

export default function AssetGroupingMasterPage() {
  const [groupings, setGroupings] = React.useState([...MOCK_GROUPINGS_INIT]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState("");
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = React.useState<number | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (index: number | null = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setCurrentValue(groupings[index]);
    } else {
      setEditingIndex(null);
      setCurrentValue("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!currentValue.trim()) {
      toast({ title: "Validation Error", description: "Grouping name cannot be empty.", variant: "destructive" });
      return;
    }

    if (editingIndex !== null) {
      const updatedGroupings = [...groupings];
      updatedGroupings[editingIndex] = currentValue;
      setGroupings(updatedGroupings);
      toast({ title: "Success", description: "Grouping updated successfully." });
    } else {
      setGroupings([...groupings, currentValue]);
      toast({ title: "Success", description: "New grouping added successfully." });
    }
    setIsDialogOpen(false);
  };

  const handleOpenAlertDialog = (index: number) => {
    setDeletingIndex(index);
    setIsAlertDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingIndex !== null) {
      const updatedGroupings = groupings.filter((_, i) => i !== deletingIndex);
      setGroupings(updatedGroupings);
      toast({ title: "Success", description: "Grouping deleted successfully." });
    }
    setIsAlertDialogOpen(false);
    setDeletingIndex(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Asset Grouping Master"
        description="Manages logical groupings of assets (by Project, Pool, Kit, Cost Center)."
        actions={
          <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Grouping
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Existing Groupings</CardTitle>
          <CardDescription>
            This enables bulk actions, project allocations, and rollup reporting.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grouping Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupings.map((name, index) => (
                  <TableRow key={name}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => handleOpenDialog(index)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleOpenAlertDialog(index)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{groupings.length} grouping(s) found.</TableCaption>
            </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingIndex !== null ? 'Edit Grouping' : 'Add New Grouping'}</DialogTitle>
                <DialogDescription>
                    {editingIndex !== null ? 'Update the name of the grouping.' : 'Enter the name for the new grouping.'}
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={currentValue} onChange={(e) => setCurrentValue(e.target.value)} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the grouping.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
