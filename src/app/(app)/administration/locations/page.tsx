// src/app/(app)/administration/locations/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, MapPin } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { STORE_LOCATIONS } from "@/lib/constants"; 
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


export default function LocationMasterPage() {
  const [locations, setLocations] = React.useState([...STORE_LOCATIONS]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState("");
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [deletingIndex, setDeletingIndex] = React.useState<number | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = (index: number | null = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setCurrentValue(locations[index]);
    } else {
      setEditingIndex(null);
      setCurrentValue("");
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!currentValue.trim()) {
      toast({ title: "Validation Error", description: "Location name cannot be empty.", variant: "destructive" });
      return;
    }

    if (editingIndex !== null) {
      const updatedData = [...locations];
      updatedData[editingIndex] = currentValue;
      setLocations(updatedData);
      toast({ title: "Success", description: "Location updated successfully." });
    } else {
      setLocations([...locations, currentValue]);
      toast({ title: "Success", description: "New location added successfully." });
    }
    setIsDialogOpen(false);
  };

  const handleOpenAlertDialog = (index: number) => {
    setDeletingIndex(index);
    setIsAlertDialogOpen(true);
  };

  const handleDelete = () => {
    if (deletingIndex !== null) {
      const updatedData = locations.filter((_, i) => i !== deletingIndex);
      setLocations(updatedData);
      toast({ title: "Success", description: "Location deleted successfully." });
    }
    setIsAlertDialogOpen(false);
    setDeletingIndex(null);
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Location Master"
        description="Defines all sites, buildings, floors, and labs where assets can be located."
        actions={
          <Button onClick={() => handleOpenDialog()}>
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
                {locations.map((loc, index) => (
                  <TableRow key={loc}>
                    <TableCell className="font-medium">{loc}</TableCell>
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
              <TableCaption>{locations.length} location(s) found.</TableCaption>
            </Table>
        
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingIndex !== null ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                <DialogDescription>
                    {editingIndex !== null ? 'Update the name of the location.' : 'Enter the name for the new location.'}
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
                    This action cannot be undone. This will permanently delete the location.
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
