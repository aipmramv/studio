
// src/app/(app)/masters/uom/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Save, Scale as ScaleIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { MOCK_UNITS_OF_MEASUREMENT } from "@/lib/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UomSchema, type UomFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function UomMasterPage() {
  const [uoms, setUoms] = React.useState<UomFormData[]>(MOCK_UNITS_OF_MEASUREMENT.map(u => ({...u})));
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingUom, setEditingUom] = React.useState<UomFormData | null>(null);
  const [uomToDelete, setUomToDelete] = React.useState<UomFormData | null>(null);
  const { toast } = useToast();

  const form = useForm<UomFormData>({
    resolver: zodResolver(UomSchema),
    defaultValues: { id: "", name: "", abbreviation: "" },
  });

  const openAddDialog = () => {
    setEditingUom(null);
    form.reset({ id: `uom_${Date.now()}`, name: "", abbreviation: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (uom: UomFormData) => {
    setEditingUom(uom);
    form.reset(uom);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (uom: UomFormData) => {
    setUomToDelete(uom);
  };

  const executeDelete = () => {
    if (!uomToDelete) return;
    setUoms(prev => prev.filter(u => u.id !== uomToDelete.id));
    toast({ title: "UOM Deleted", description: `${uomToDelete.name} (${uomToDelete.abbreviation}) has been removed.` });
    setUomToDelete(null);
  };

  const handleFormSubmit = (data: UomFormData) => {
    if (editingUom) {
      setUoms(prev => prev.map(u => u.id === editingUom.id ? { ...u, ...data } : u));
      toast({ title: "UOM Updated", description: `UOM ${data.name} updated.` });
    } else {
      const newUom = { ...data, id: `uom_${Date.now()}` };
      setUoms(prev => [...prev, newUom]);
      toast({ title: "UOM Added", description: `UOM ${data.name} added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Units of Measurement (UOM) Master"
        description="Manage standard units for materials and quantities."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New UOM
          </Button>
        }
      />

      {uomToDelete && (
        <AlertDialog open={!!uomToDelete} onOpenChange={() => setUomToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete UOM "{uomToDelete.name} ({uomToDelete.abbreviation})"? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUomToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingUom(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingUom ? "Edit" : "Add New"} Unit of Measurement</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Unit Name</FormLabel><FormControl><Input placeholder="e.g., Kilograms" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="abbreviation" render={({ field }) => (
                <FormItem><FormLabel>Abbreviation</FormLabel><FormControl><Input placeholder="e.g., KG" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="id" render={({ field }) => (<Input type="hidden" {...field} />)} />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingUom ? "Save Changes" : "Add UOM"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ScaleIcon className="w-5 h-5 mr-2 text-primary" /> Existing Units of Measurement</CardTitle>
          <CardDescription>View, add, edit, or delete UOMs.</CardDescription>
        </CardHeader>
        <CardContent>
          {uoms.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unit Name</TableHead>
                  <TableHead>Abbreviation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uoms.map((uom) => (
                  <TableRow key={uom.id}>
                    <TableCell className="font-medium">{uom.name}</TableCell>
                    <TableCell>{uom.abbreviation}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(uom)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(uom)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{uoms.length} UOM(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No UOMs found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
