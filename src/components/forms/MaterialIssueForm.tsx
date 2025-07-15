// src/components/forms/MaterialIssueForm.tsx
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
import { Textarea } from "@/components/ui/textarea";
import { MaterialIssueSchema, type MaterialIssueFormData } from "@/lib/schemas";
import { DEPARTMENTS, STORE_LOCATIONS } from "@/lib/constants";
import { mockInventoryData } from "@/lib/mock-inventory-data";
import { cn } from "@/lib/utils";

interface MaterialIssueFormProps {
  initialData?: MaterialIssueFormData | null;
  onSave: (data: MaterialIssueFormData) => void;
  onCancel: () => void;
}

export function MaterialIssueForm({ initialData, onSave, onCancel }: MaterialIssueFormProps) {
  const form = useForm<MaterialIssueFormData>({
    resolver: zodResolver(MaterialIssueSchema),
    defaultValues: initialData ? { ...initialData, issueDate: new Date(initialData.issueDate) } : {
      requestCode: "",
      issuedTo: "",
      issueDate: new Date(),
      storeLocation: undefined,
      purpose: "",
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
          <FormField control={form.control} name="issuedTo" render={({ field }) => (
              <FormItem><FormLabel>Issued To Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                  <SelectContent>{DEPARTMENTS.map((dept) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="storeLocation" render={({ field }) => (
              <FormItem><FormLabel>Issuing Store Location</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger></FormControl>
                  <SelectContent>{STORE_LOCATIONS.map((loc) => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}</SelectContent>
                </Select><FormMessage />
              </FormItem>
            )}
          />
           <FormField control={form.control} name="issueDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Issue Date</FormLabel>
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
          <FormField control={form.control} name="requestCode" render={({ field }) => (
              <FormItem><FormLabel>Request Code (Optional)</FormLabel><FormControl><Input placeholder="e.g., MRQ050" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>
          <div className="md:col-span-2">
            <FormField control={form.control} name="purpose" render={({ field }) => (
              <FormItem><FormLabel>Purpose of Issue</FormLabel><FormControl><Textarea placeholder="e.g., Scheduled Production, Urgent Repair" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-md font-medium">Items to Issue</h3>
          {fields.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-2 p-2 mb-2 border rounded-md md:grid-cols-12">
              <FormField control={form.control} name={`items.${index}.materialId`} render={({ field }) => (
                  <FormItem className="md:col-span-6"><FormLabel className="sr-only">Material ID</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select Material" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {mockInventoryData.map((invItem) => <SelectItem key={invItem.id} value={invItem.id}>{invItem.name} ({invItem.id}) - Avl: {invItem.quantityOnHand}</SelectItem>)}
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
            {form.formState.isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Saving...</> : <><Save className="w-4 h-4 mr-2"/>Save Issue</>}
          </Button>
        </div>
      </form>
    </Form>
  );
}
