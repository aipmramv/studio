// src/components/forms/MaterialReceiptForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Save, Send, Trash2, Loader2, Ban } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MaterialReceiptSchema, type MaterialReceiptFormData } from "@/lib/schemas";
import { MOCK_VENDORS, STORE_LOCATIONS } from "@/lib/constants";
import { mockInventoryData } from "@/lib/mock-inventory-data";
import { cn } from "@/lib/utils";

interface MaterialReceiptFormProps {
  initialData?: MaterialReceiptFormData | null;
  onSave: (data: MaterialReceiptFormData) => void;
  onCancel: () => void;
}

export function MaterialReceiptForm({ initialData, onSave, onCancel }: MaterialReceiptFormProps) {
  const form = useForm<MaterialReceiptFormData>({
    resolver: zodResolver(MaterialReceiptSchema),
    defaultValues: initialData ? { ...initialData, receiptDate: new Date(initialData.receiptDate) } : {
      grnNumber: "",
      poNumber: "",
      vendorName: "",
      receiptDate: new Date(),
      storeLocation: undefined,
      status: "Pending QA",
      items: [{ materialId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField control={form.control} name="vendorName" render={({ field }) => (
              <FormItem><FormLabel>Vendor Name</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger></FormControl>
                  <SelectContent>{MOCK_VENDORS.map((vendor) => <SelectItem key={vendor.id} value={vendor.name}>{vendor.name}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="storeLocation" render={({ field }) => (
              <FormItem><FormLabel>Store Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select store location" /></SelectTrigger></FormControl>
                  <SelectContent>{STORE_LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="receiptDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Receipt Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild><FormControl>
                      <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                      </Button>
                  </FormControl></PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                  </PopoverContent>
                </Popover><FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="status" render={({ field }) => (
              <FormItem><FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Pending QA">Pending QA</SelectItem>
                    <SelectItem value="Received">Received</SelectItem>
                    <SelectItem value="Partial QA">Partial QA</SelectItem>
                  </SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="grnNumber" render={({ field }) => (
            <FormItem><FormLabel>GRN Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., GRN2024150" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <FormField control={form.control} name="poNumber" render={({ field }) => (
            <FormItem><FormLabel>PO Number (Optional)</FormLabel><FormControl><Input placeholder="e.g., PO2024001" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
        </div>

        <div>
          <h3 className="mb-2 text-md font-medium">Received Items</h3>
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-2 p-2 mb-2 border rounded-md md:grid-cols-12">
              <FormField control={form.control} name={`items.${index}.materialId`} render={({ field }) => (
                  <FormItem className="md:col-span-6"><FormLabel className="sr-only">Material ID</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Material" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {mockInventoryData.map((invItem) => <SelectItem key={invItem.id} value={invItem.id}>{invItem.name} ({invItem.id})</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )}
              />
              <FormField control={form.control} name={`items.${index}.quantity`} render={({ field }) => (
                  <FormItem className="md:col-span-5"><FormLabel className="sr-only">Quantity</FormLabel><FormControl><Input type="number" placeholder="Quantity" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <div className="flex items-end md:col-span-1">
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="w-full"><Trash2 className="w-4 h-4" /><span className="sr-only">Remove</span></Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => append({ materialId: "", quantity: 1 })} className="mt-2"><PlusCircle className="w-4 h-4 mr-2" /> Add Item</Button>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}><Ban className="w-4 h-4 mr-2"/>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Saving...</> : <><Save className="w-4 h-4 mr-2"/>Save Receipt</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
