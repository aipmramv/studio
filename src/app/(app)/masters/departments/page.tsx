
// src/app/(app)/masters/departments/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { DEPARTMENTS as INITIAL_DEPARTMENTS } from "@/lib/constants";
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
import { DepartmentSchema, type DepartmentFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface DepartmentItem {
  id: string;
  name: string;
}

export default function DepartmentsMasterPage() {
  const [departments, setDepartments] = React.useState<DepartmentItem[]>(
    INITIAL_DEPARTMENTS.map((name, index) => ({ id: `dept_${index + 1}`, name }))
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingDept, setEditingDept] = React.useState<DepartmentItem | null>(null);
  const [deptToDelete, setDeptToDelete] = React.useState<DepartmentItem | null>(null);
  const { toast } = useToast();

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(DepartmentSchema),
    defaultValues: { name: "" },
  });

  const openAddDialog = () => {
    setEditingDept(null);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (dept: DepartmentItem) => {
    setEditingDept(dept);
    form.reset({ name: dept.name });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (dept: DepartmentItem) => {
    setDeptToDelete(dept);
  };

  const executeDelete = () => {
    if (!deptToDelete) return;
    setDepartments(prev => prev.filter(d => d.id !== deptToDelete.id));
    toast({ title: "Department Deleted", description: `${deptToDelete.name} has been removed.` });
    setDeptToDelete(null);
  };

  const handleFormSubmit = (data: DepartmentFormData) => {
    if (editingDept) {
      setDepartments(prev => prev.map(d => d.id === editingDept.id ? { ...d, name: data.name } : d));
      toast({ title: "Department Updated", description: `Department ${data.name} updated.` });
    } else {
      const newDept = { id: `dept_${Date.now()}`, name: data.name };
      setDepartments(prev => [...prev, newDept]);
      toast({ title: "Department Added", description: `Department ${data.name} added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Departments Master"
        description="Manage organizational departments."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Department
          </Button>
        }
      />

      {deptToDelete && (
        <AlertDialog open={!!deptToDelete} onOpenChange={() => setDeptToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete department "{deptToDelete.name}"? This action cannot be undone.
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
          setEditingDept(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDept ? "Edit" : "Add New"} Department</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Human Resources" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingDept ? "Save Changes" : "Add Department"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      <Card>
        <CardHeader>
          <CardTitle>Existing Departments</CardTitle>
          <CardDescription>View, add, edit, or delete organizational departments.</CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">{dept.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => openEditDialog(dept)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(dept)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{departments.length} department(s) found.</TableCaption>
            </Table>
          ) : (
             <p className="text-center text-muted-foreground py-4">No departments found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
