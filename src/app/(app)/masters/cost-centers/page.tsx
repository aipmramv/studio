
// src/app/(app)/masters/cost-centers/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Save, DollarSignIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { COST_CENTERS as INITIAL_COST_CENTERS } from "@/lib/constants";
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
import { CostCenterSchema, type CostCenterFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface CostCenterItem {
  id: string;
  name: string;
}

export default function CostCentersMasterPage() {
  const [costCenters, setCostCenters] = React.useState<CostCenterItem[]>(
    INITIAL_COST_CENTERS.map((name, index) => ({ id: `cc_${index + 1}`, name }))
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCostCenter, setEditingCostCenter] = React.useState<CostCenterItem | null>(null);
  const [costCenterToDelete, setCostCenterToDelete] = React.useState<CostCenterItem | null>(null);
  const { toast } = useToast();

  const form = useForm<CostCenterFormData>({
    resolver: zodResolver(CostCenterSchema),
    defaultValues: { name: "" }
  });

  const openAddDialog = () => {
    setEditingCostCenter(null);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (cc: CostCenterItem) => {
    setEditingCostCenter(cc);
    form.reset({ name: cc.name });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (cc: CostCenterItem) => {
    setCostCenterToDelete(cc);
  };

  const executeDelete = () => {
    if (!costCenterToDelete) return;
    setCostCenters(prev => prev.filter(cc => cc.id !== costCenterToDelete.id));
    toast({ title: "Cost Center Deleted", description: `${costCenterToDelete.name} has been removed.` });
    setCostCenterToDelete(null);
  };

  const handleFormSubmit = (data: CostCenterFormData) => {
    if (editingCostCenter) {
      setCostCenters(prev => prev.map(cc => cc.id === editingCostCenter.id ? { ...cc, name: data.name } : cc));
      toast({ title: "Cost Center Updated", description: `Cost Center ${data.name} updated.` });
    } else {
      const newCostCenter = { id: `cc_${Date.now()}`, name: data.name };
      setCostCenters(prev => [...prev, newCostCenter]);
      toast({ title: "Cost Center Added", description: `Cost Center ${data.name} added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cost Centers Master"
        description="Manage organizational cost centers."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Cost Center
          </Button>
        }
      />

      {costCenterToDelete && (
        <AlertDialog open={!!costCenterToDelete} onOpenChange={() => setCostCenterToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete cost center "{costCenterToDelete.name}"? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCostCenterToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingCostCenter(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCostCenter ? "Edit" : "Add New"} Cost Center</DialogTitle>
            <DialogDescription>
              {editingCostCenter ? "Modify the name of this cost center." : "Enter the name for the new cost center."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Center Name/ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., CC_RD_001_Electronics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingCostCenter ? "Save Changes" : "Add Cost Center"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><DollarSignIcon className="w-5 h-5 mr-2 text-primary" /> Existing Cost Centers</CardTitle>
          <CardDescription>View, add, edit, or delete cost centers.</CardDescription>
        </CardHeader>
        <CardContent>
          {costCenters.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name/ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCenters.map((cc) => (
                  <TableRow key={cc.id}>
                    <TableCell className="font-medium">{cc.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(cc)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(cc)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{costCenters.length} cost center(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No cost centers found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
