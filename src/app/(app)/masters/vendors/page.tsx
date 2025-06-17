
// src/app/(app)/masters/vendors/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Save, Building2, User, Mail, Phone, Tag } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { MOCK_VENDORS } from "@/lib/constants";
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
import { VendorSchema, type VendorFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function VendorsMasterPage() {
  const [vendors, setVendors] = React.useState<VendorFormData[]>(MOCK_VENDORS.map(v => ({...v})));
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingVendor, setEditingVendor] = React.useState<VendorFormData | null>(null);
  const [vendorToDelete, setVendorToDelete] = React.useState<VendorFormData | null>(null);
  const { toast } = useToast();

  const form = useForm<VendorFormData>({
    resolver: zodResolver(VendorSchema),
    defaultValues: { id: "", name: "", contactPerson: "", email: "", phone: "", category: "" },
  });

  const openAddDialog = () => {
    setEditingVendor(null);
    form.reset({ id: `vend_${Date.now()}`, name: "", contactPerson: "", email: "", phone: "", category: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (vendor: VendorFormData) => {
    setEditingVendor(vendor);
    form.reset(vendor);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (vendor: VendorFormData) => {
    setVendorToDelete(vendor);
  };

  const executeDelete = () => {
    if (!vendorToDelete) return;
    setVendors(prev => prev.filter(v => v.id !== vendorToDelete.id));
    toast({ title: "Vendor Deleted", description: `${vendorToDelete.name} has been removed.` });
    setVendorToDelete(null);
  };

  const handleFormSubmit = (data: VendorFormData) => {
    if (editingVendor) {
      setVendors(prev => prev.map(v => v.id === editingVendor.id ? { ...v, ...data } : v));
      toast({ title: "Vendor Updated", description: `Vendor ${data.name} updated.` });
    } else {
      const newVendor = { ...data, id: `vend_${Date.now()}` };
      setVendors(prev => [...prev, newVendor]);
      toast({ title: "Vendor Added", description: `Vendor ${data.name} added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vendors Master"
        description="Manage all supplier and vendor information."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Vendor
          </Button>
        }
      />

      {vendorToDelete && (
        <AlertDialog open={!!vendorToDelete} onOpenChange={() => setVendorToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete vendor "{vendorToDelete.name}"? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setVendorToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingVendor(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVendor ? "Edit" : "Add New"} Vendor</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Vendor Name</FormLabel><FormControl><Input placeholder="e.g., Tech Solutions Inc." {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="contactPerson" render={({ field }) => (
                <FormItem><FormLabel>Contact Person (Optional)</FormLabel><FormControl><Input placeholder="e.g., Mr. Sharma" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input type="email" placeholder="e.g., sales@example.com" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Phone (Optional)</FormLabel><FormControl><Input placeholder="e.g., 9876543210" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., IT Equipment, Raw Materials" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="id" render={({ field }) => (<Input type="hidden" {...field} />)} />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingVendor ? "Save Changes" : "Add Vendor"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><Building2 className="w-5 h-5 mr-2 text-primary" /> Existing Vendors</CardTitle>
          <CardDescription>View, add, edit, or delete vendors.</CardDescription>
        </CardHeader>
        <CardContent>
          {vendors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.contactPerson || "N/A"}</TableCell>
                    <TableCell>{vendor.email || "N/A"}</TableCell>
                    <TableCell>{vendor.phone || "N/A"}</TableCell>
                    <TableCell>{vendor.category}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(vendor)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(vendor)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{vendors.length} vendor(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No vendors found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
