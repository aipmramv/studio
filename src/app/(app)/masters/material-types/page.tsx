
// src/app/(app)/masters/material-types/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { MATERIAL_TYPES as INITIAL_MATERIAL_TYPES } from "@/lib/constants";
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
import { MaterialTypeSchema, type MaterialTypeFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface MaterialTypeItem {
  id: string;
  name: string;
}

export default function MaterialTypesMasterPage() {
  const [materialTypes, setMaterialTypes] = React.useState<MaterialTypeItem[]>(
    INITIAL_MATERIAL_TYPES.map((name, index) => ({ id: `mt_${index + 1}`, name }))
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingType, setEditingType] = React.useState<MaterialTypeItem | null>(null);
  const [typeToDelete, setTypeToDelete] = React.useState<MaterialTypeItem | null>(null);
  const { toast } = useToast();

  const form = useForm<MaterialTypeFormData>({
    resolver: zodResolver(MaterialTypeSchema),
    defaultValues: {
        name: "",
    }
  });

  const openAddDialog = () => {
    setEditingType(null);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (type: MaterialTypeItem) => {
    setEditingType(type);
    form.reset({ name: type.name });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (type: MaterialTypeItem) => {
    setTypeToDelete(type);
  };

  const executeDelete = () => {
    if (!typeToDelete) return;
    setMaterialTypes(prev => prev.filter(mt => mt.id !== typeToDelete.id));
    toast({ title: "Material Type Deleted", description: `${typeToDelete.name} has been removed.` });
    setTypeToDelete(null);
  };

  const handleFormSubmit = (data: MaterialTypeFormData) => {
    if (editingType) {
      setMaterialTypes(prev => prev.map(mt => mt.id === editingType.id ? { ...mt, name: data.name } : mt));
      toast({ title: "Material Type Updated", description: `Material type ${data.name} updated.` });
    } else {
      const newType = { id: `mt_${Date.now()}`, name: data.name };
      setMaterialTypes(prev => [...prev, newType]);
      toast({ title: "Material Type Added", description: `Material type ${data.name} added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Material Types Master"
        description="Manage the types of materials used in the system."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Material Type
          </Button>
        }
      />

      {typeToDelete && (
        <AlertDialog open={!!typeToDelete} onOpenChange={() => setTypeToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete material type "{typeToDelete.name}"? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTypeToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingType(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit" : "Add New"} Material Type</DialogTitle>
            <DialogDescription>
              {editingType ? "Modify the name of this material type." : "Enter the name for the new material type."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Raw Component X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingType ? "Save Changes" : "Add Type"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Existing Material Types</CardTitle>
          <CardDescription>View, add, edit, or delete material types.</CardDescription>
        </CardHeader>
        <CardContent>
          {materialTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-medium">{type.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(type)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(type)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{materialTypes.length} material type(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No material types found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

