
// src/app/(app)/masters/department-budgets/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Save, Landmark, CalendarDays, Users, Briefcase } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { MOCK_DEPARTMENT_BUDGETS, DEPARTMENTS, FISCAL_YEARS, type DepartmentBudget } from "@/lib/constants";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DepartmentBudgetSchema, type DepartmentBudgetFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function DepartmentBudgetsMasterPage() {
  const [budgets, setBudgets] = React.useState<DepartmentBudget[]>(MOCK_DEPARTMENT_BUDGETS);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingBudget, setEditingBudget] = React.useState<DepartmentBudget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = React.useState<DepartmentBudget | null>(null);
  const { toast } = useToast();
  const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const form = useForm<DepartmentBudgetFormData>({
    resolver: zodResolver(DepartmentBudgetSchema),
    defaultValues: {
      id: "",
      department: undefined,
      year: undefined,
      q1Budget: 0,
      q2Budget: 0,
      q3Budget: 0,
      q4Budget: 0,
    },
  });

  const openAddDialog = () => {
    setEditingBudget(null);
    form.reset({ id: `db_${Date.now()}`, department: undefined, year: undefined, q1Budget: 0, q2Budget: 0, q3Budget: 0, q4Budget: 0 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (budget: DepartmentBudget) => {
    setEditingBudget(budget);
    form.reset(budget);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (budget: DepartmentBudget) => {
    setBudgetToDelete(budget);
  };

  const executeDelete = () => {
    if (!budgetToDelete) return;
    setBudgets(prev => prev.filter(b => b.id !== budgetToDelete.id));
    toast({ title: "Budget Record Deleted", description: `Budget for ${budgetToDelete.department} (${budgetToDelete.year}) has been removed.` });
    setBudgetToDelete(null);
  };

  const handleFormSubmit = (data: DepartmentBudgetFormData) => {
    if (editingBudget) {
      setBudgets(prev => prev.map(b => b.id === editingBudget.id ? { ...b, ...data } : b));
      toast({ title: "Budget Updated", description: `Budget for ${data.department} (${data.year}) updated.` });
    } else {
      const newBudget: DepartmentBudget = { ...data, id: `db_${Date.now()}` };
      setBudgets(prev => [...prev, newBudget]);
      toast({ title: "Budget Added", description: `Budget for ${data.department} (${data.year}) added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Department Budgets Master"
        description="Manage quarterly budgets for all departments and fiscal years."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Budget Record
          </Button>
        }
      />

      {budgetToDelete && (
        <AlertDialog open={!!budgetToDelete} onOpenChange={() => setBudgetToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete the budget for "{budgetToDelete.department} ({budgetToDelete.year})"? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBudgetToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingBudget(null);
        }
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit" : "Add New"} Department Budget</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Briefcase className="w-4 h-4 mr-1"/>Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger></FormControl>
                      <SelectContent>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="year" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><CalendarDays className="w-4 h-4 mr-1"/>Fiscal Year</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Year" /></SelectTrigger></FormControl>
                      <SelectContent>{FISCAL_YEARS.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="q1Budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">Q1 Budget (Apr-Jun)</FormLabel>
                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="q2Budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">Q2 Budget (Jul-Sep)</FormLabel>
                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="q3Budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">Q3 Budget (Oct-Dec)</FormLabel>
                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )}/>
                <FormField control={form.control} name="q4Budget" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">Q4 Budget (Jan-Mar)</FormLabel>
                    <FormControl><Input type="number" placeholder="0.00" {...field} /></FormControl><FormMessage />
                  </FormItem>
                )}/>
              </div>
              <FormField control={form.control} name="id" render={({ field }) => (<Input type="hidden" {...field} />)} />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingBudget ? "Save Changes" : "Add Budget"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Landmark className="w-5 h-5 mr-2 text-primary" /> Department Budget Records</CardTitle>
          <CardDescription>View, add, edit, or delete department budgets.</CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Fiscal Year</TableHead>
                  <TableHead className="text-right">Q1 Budget</TableHead>
                  <TableHead className="text-right">Q2 Budget</TableHead>
                  <TableHead className="text-right">Q3 Budget</TableHead>
                  <TableHead className="text-right">Q4 Budget</TableHead>
                  <TableHead className="text-right">Total Annual</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgets.map((budget) => {
                  const totalAnnual = budget.q1Budget + budget.q2Budget + budget.q3Budget + budget.q4Budget;
                  return (
                    <TableRow key={budget.id}>
                      <TableCell className="font-medium">{budget.department}</TableCell>
                      <TableCell>{budget.year}</TableCell>
                      <TableCell className="text-right">{budget.q1Budget.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell>
                      <TableCell className="text-right">{budget.q2Budget.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell>
                      <TableCell className="text-right">{budget.q3Budget.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell>
                      <TableCell className="text-right">{budget.q4Budget.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell>
                      <TableCell className="text-right font-semibold">{totalAnnual.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(budget)}>
                          <Edit className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(budget)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableCaption>{budgets.length} budget record(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No department budgets found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

