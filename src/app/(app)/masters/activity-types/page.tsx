
// src/app/(app)/masters/activity-types/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Save } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { ACTIVITY_TYPES_WORK_PERMIT as INITIAL_ACTIVITY_TYPES } from "@/lib/constants";
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
import { ActivityTypeSchema, type ActivityTypeFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ActivityTypeItem {
  id: string;
  name: string;
}

export default function ActivityTypesMasterPage() {
  const [activityTypes, setActivityTypes] = React.useState<ActivityTypeItem[]>(
    INITIAL_ACTIVITY_TYPES.map((name, index) => ({ id: `at_${index + 1}`, name }))
  );
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingActivity, setEditingActivity] = React.useState<ActivityTypeItem | null>(null);
  const [activityToDelete, setActivityToDelete] = React.useState<ActivityTypeItem | null>(null);
  const { toast } = useToast();

  const form = useForm<ActivityTypeFormData>({
    resolver: zodResolver(ActivityTypeSchema),
    defaultValues: { name: "" }
  });

  const openAddDialog = () => {
    setEditingActivity(null);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (activity: ActivityTypeItem) => {
    setEditingActivity(activity);
    form.reset({ name: activity.name });
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (activity: ActivityTypeItem) => {
    setActivityToDelete(activity);
  };

  const executeDelete = () => {
    if (!activityToDelete) return;
    setActivityTypes(prev => prev.filter(at => at.id !== activityToDelete.id));
    toast({ title: "Activity Type Deleted", description: `${activityToDelete.name} has been removed.` });
    setActivityToDelete(null);
  };

  const handleFormSubmit = (data: ActivityTypeFormData) => {
    if (editingActivity) {
      setActivityTypes(prev => prev.map(at => at.id === editingActivity.id ? { ...at, name: data.name } : at));
      toast({ title: "Activity Type Updated", description: `Activity type ${data.name} updated.` });
    } else {
      const newActivityType = { id: `at_${Date.now()}`, name: data.name };
      setActivityTypes(prev => [...prev, newActivityType]);
      toast({ title: "Activity Type Added", description: `Activity type ${data.name} added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activity Types Master (Work Permit)"
        description="Manage activity types for work permits."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Activity Type
          </Button>
        }
      />

      {activityToDelete && (
        <AlertDialog open={!!activityToDelete} onOpenChange={() => setActivityToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete activity type "{activityToDelete.name}"? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setActivityToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingActivity(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingActivity ? "Edit" : "Add New"} Activity Type</DialogTitle>
            <DialogDescription>
              {editingActivity ? "Modify the name of this activity type." : "Enter the name for the new activity type."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hot Work" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingActivity ? "Save Changes" : "Add Type"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Existing Activity Types</CardTitle>
          <CardDescription>View, add, edit, or delete activity types for Work Permits.</CardDescription>
        </CardHeader>
        <CardContent>
          {activityTypes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityTypes.map((type) => (
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
              <TableCaption>{activityTypes.length} activity type(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No activity types found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
