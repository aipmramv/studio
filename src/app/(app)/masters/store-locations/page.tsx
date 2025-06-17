
// src/app/(app)/masters/store-locations/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, MapPin, Save, Store as StoreIcon } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { STORE_LOCATIONS as INITIAL_STORE_LOCATIONS, USER_ROLES } from "@/lib/constants"; // Assuming STORE_LOCATIONS is array of strings for now
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
import { StoreLocationSchema, type StoreLocationFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Convert initial simple string array to StoreLocation objects for consistency
const initialMockStores: StoreLocationFormData[] = INITIAL_STORE_LOCATIONS.map((loc, index) => ({
  id: `SL_${Date.now() + index}`,
  name: loc,
  location: `Details for ${loc}`, // Placeholder detail
  type: (index % 3 === 0) ? "Main Warehouse" : (index % 3 === 1) ? "Sub-Store" : "Production Floor", // Placeholder type
  manager: (index % 2 === 0) ? "Manager Name" : undefined, // Placeholder manager
}));


export default function StoreLocationsMasterPage() {
  const [stores, setStores] = React.useState<StoreLocationFormData[]>(initialMockStores);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingStore, setEditingStore] = React.useState<StoreLocationFormData | null>(null);
  const [storeToDelete, setStoreToDelete] = React.useState<StoreLocationFormData | null>(null);
  const { toast } = useToast();

  const form = useForm<StoreLocationFormData>({
    resolver: zodResolver(StoreLocationSchema),
    defaultValues: { id: "", name: "", location: "", type: undefined, manager: "" },
  });

  const openAddDialog = () => {
    setEditingStore(null);
    form.reset({ id: `sl_${Date.now()}`, name: "", location: "", type: undefined, manager: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (store: StoreLocationFormData) => {
    setEditingStore(store);
    form.reset(store);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirmation = (store: StoreLocationFormData) => {
    setStoreToDelete(store);
  };

  const executeDelete = () => {
    if (!storeToDelete) return;
    setStores(prev => prev.filter(s => s.id !== storeToDelete.id));
    toast({ title: "Store Location Deleted", description: `${storeToDelete.name} has been removed.` });
    setStoreToDelete(null);
  };

  const handleFormSubmit = (data: StoreLocationFormData) => {
    if (editingStore) {
      setStores(prev => prev.map(s => s.id === editingStore.id ? { ...s, ...data } : s));
      toast({ title: "Store Location Updated", description: `Store ${data.name} updated.` });
    } else {
      const newStore = { ...data, id: `sl_${Date.now()}` };
      setStores(prev => [...prev, newStore]);
      toast({ title: "Store Location Added", description: `Store ${data.name} added.` });
    }
    setIsDialogOpen(false);
    form.reset();
  };
  
  const storeTypes = ["Main Warehouse", "Sub-Store", "Production Floor", "Quality Lab", "Dispatch Area", "Receiving Bay"] as StoreLocationFormData["type"][];


  return (
    <div className="space-y-8">
      <PageHeader
        title="Store Locations Master"
        description="Manage all physical store locations within the organization."
        actions={
          <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Store Location
          </Button>
        }
      />

      {storeToDelete && (
        <AlertDialog open={!!storeToDelete} onOpenChange={() => setStoreToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirm Deletion</AlertDialogTitle></AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete store location "{storeToDelete.name}"? This action cannot be undone.
            </AlertDialogDescription>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setStoreToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingStore(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingStore ? "Edit" : "Add New"} Store Location</DialogTitle>
            <DialogDescription>
              {editingStore ? "Modify the details of this store location." : "Enter details for the new store location."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Central Warehouse Alpha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Location Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Block A, Industrial Area, Near Gate 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select store type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {storeTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="manager"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Manager (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="id"
                render={({ field }) => (<Input type="hidden" {...field} />)}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingStore ? "Save Changes" : "Add Store"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><StoreIcon className="w-5 h-5 mr-2 text-primary" /> Existing Store Locations</CardTitle>
          <CardDescription>View, add, edit, or delete store locations.</CardDescription>
        </CardHeader>
        <CardContent>
          {stores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Name</TableHead>
                  <TableHead>Location Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-muted-foreground" />{store.location}</TableCell>
                    <TableCell><Badge variant="outline">{store.type}</Badge></TableCell>
                    <TableCell>{store.manager || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(store)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation(store)}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{stores.length} store location(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No store locations configured yet. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
