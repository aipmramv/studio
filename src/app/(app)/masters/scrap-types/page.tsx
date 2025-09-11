
// src/app/(app)/masters/scrap-types/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Save, Recycle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { SCRAP_TYPES as INITIAL_SCRAP_TYPES } from "@/lib/constants";
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
import { ScrapTypeSchema, type ScrapTypeFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ScrapTypeItem {
  id: string;
  name: string;
}

export default function ScrapTypesMasterPage() {
  const [scrapTypes, setScrapTypes] = React.useState<ScrapTypeItem[]>(
    INITIAL_SCRAP_TYPES.map((name, index) => ({ id: `st_${index + 1}`, name }))
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingType, setEditingType] = React.useState<ScrapTypeItem | null>(null);
  const [typeToDelete, setTypeToDelete] = React.useState<ScrapTypeItem | null>(null);
  const { toast } = useToast();

  const form = useForm<ScrapTypeFormData>({
    resolver: zodResolver(ScrapTypeSchema),
    defaultValues: { name: "" }
  });

  const openAddDialog = () => {
    setEditingType(null);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (type: ScrapTypeItem) => {
    setEditingType(type);
    form.reset({ name: type.name });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (type: ScrapTypeItem) => {
    setTypeToDelete(type);
  };

  const executeDelete = () => {
    if (!typeToDelete) return;
    setScrapTypes(prev => prev.filter(st => st.id !== typeToDelete.id));
    toast({ title: "Scrap Type Deleted", description: `${typeToDelete.name} has been removed.` });
    setTypeToDelete(null);
  };

  const handleFormSubmit = (data: ScrapTypeFormData) => {
    if (editingType) {
      setScrapTypes(prev => prev.map(st => st.id === editingType.id ? { ...st, name: data.name } : st));
      toast({ title: "Scrap Type Updated", description: `Scrap type ${data.name} updated.` });
    } else {
      const newType = { id: `st_${Date.now()}`, name: data.name };
      setScrapTypes(prev => [...prev, newType]);
      toast({ title: "Scrap Type Added", description: `Scrap type ${data.name} added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scrap Types Master"
        description="Manage the types of scrap materials."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Scrap Type
          </Button>
        }
      />

       {typeToDelete && (
        <AlertDialog open={!!typeToDelete} onOpenChange={() => setTypeToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete scrap type "{typeToDelete.name}"? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
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
            <DialogTitle>{editingType ? "Edit" : "Add New"} Scrap Type</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scrap Type Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Ferrous Metal" {...field} /></FormControl>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Recycle className="w-5 h-5 mr-2 text-primary" /> Existing Scrap Types</CardTitle>
          <CardDescription>View, add, edit, or delete scrap types.</CardDescription>
        </CardHeader>
        <CardContent>
          {scrapTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scrapTypes.map((type) => (
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
              <TableCaption>{scrapTypes.length} scrap type(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No scrap types found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
