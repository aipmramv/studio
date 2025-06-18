
// src/app/(app)/masters/hsn-sac-codes/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Save, Tag as TagIcon, Hash, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { MOCK_HSN_SAC_CODES } from "@/lib/constants";
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
import { HsnSacCodeSchema, type HsnSacCodeFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

export default function HsnSacCodesMasterPage() {
  const [codes, setCodes] = React.useState<HsnSacCodeFormData[]>(MOCK_HSN_SAC_CODES.map(c => ({...c})));
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCode, setEditingCode] = React.useState<HsnSacCodeFormData | null>(null);
  const [codeToDelete, setCodeToDelete] = React.useState<HsnSacCodeFormData | null>(null);
  const { toast } = useToast();

  const form = useForm<HsnSacCodeFormData>({
    resolver: zodResolver(HsnSacCodeSchema),
    defaultValues: { id: "", code: "", description: "", type: undefined },
  });

  const openAddDialog = () => {
    setEditingCode(null);
    form.reset({ id: `hsn_${Date.now()}`, code: "", description: "", type: undefined });
    setIsDialogOpen(true);
  };

  const openEditDialog = (codeEntry: HsnSacCodeFormData) => {
    setEditingCode(codeEntry);
    form.reset(codeEntry);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (codeEntry: HsnSacCodeFormData) => {
    setCodeToDelete(codeEntry);
  };

  const executeDelete = () => {
    if (!codeToDelete) return;
    setCodes(prev => prev.filter(c => c.id !== codeToDelete.id));
    toast({ title: "Code Deleted", description: `HSN/SAC code ${codeToDelete.code} has been removed.` });
    setCodeToDelete(null);
  };

  const handleFormSubmit = (data: HsnSacCodeFormData) => {
    if (editingCode) {
      setCodes(prev => prev.map(c => c.id === editingCode.id ? { ...c, ...data } : c));
      toast({ title: "Code Updated", description: `HSN/SAC code ${data.code} updated.` });
    } else {
      const newCode = { ...data, id: `hsn_${Date.now()}` };
      setCodes(prev => [...prev, newCode]);
      toast({ title: "Code Added", description: `HSN/SAC code ${data.code} added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="HSN/SAC Codes Master"
        description="Manage Harmonized System Nomenclature (HSN) and Service Accounting Codes (SAC)."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Code
          </Button>
        }
      />

      {codeToDelete && (
        <AlertDialog open={!!codeToDelete} onOpenChange={() => setCodeToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete code "{codeToDelete.code}"? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setCodeToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingCode(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCode ? "Edit" : "Add New"} HSN/SAC Code</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem><FormLabel>Code</FormLabel><FormControl><Input placeholder="e.g., 84713010 or 997331" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Laptops, personal computers" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="HSN">HSN (Goods)</SelectItem>
                        <SelectItem value="SAC">SAC (Services)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="id" render={({ field }) => (<Input type="hidden" {...field} />)} />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingCode ? "Save Changes" : "Add Code"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><TagIcon className="w-5 h-5 mr-2 text-primary" /> Existing HSN/SAC Codes</CardTitle>
          <CardDescription>View, add, edit, or delete HSN/SAC codes.</CardDescription>
        </CardHeader>
        <CardContent>
          {codes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((codeEntry) => (
                  <TableRow key={codeEntry.id}>
                    <TableCell className="font-medium">{codeEntry.code}</TableCell>
                    <TableCell>{codeEntry.description}</TableCell>
                    <TableCell><Badge variant={codeEntry.type === 'HSN' ? "default" : "secondary"}>{codeEntry.type}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(codeEntry)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(codeEntry)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{codes.length} HSN/SAC code(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No HSN/SAC codes found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
