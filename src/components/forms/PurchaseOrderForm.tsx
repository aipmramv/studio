
// src/components/forms/PurchaseOrderForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as React from "react";
import { CalendarIcon, PlusCircle, Send, ShoppingCart, Trash2, Loader2, Briefcase, Tag, Hash, Users, Percent, FileType, Info, Building } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PurchaseOrderSchema, type PurchaseOrderFormData, type OrderItem } from "@/lib/schemas";
import { DEPARTMENTS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload"; 

export function PurchaseOrderForm() {
  const { toast } = useToast();
  const [attachments, setAttachments] = React.useState<File | null>(null);

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(PurchaseOrderSchema),
    defaultValues: {
      poCategory: "",
      department: undefined,
      vendorName: "",
      kmKmgCode: "",
      costCenter: "",
      ioNumber: "",
      poDate: new Date(),
      items: [{ itemName: "", quantity: 1, unitPrice: 0, hsnSacCode: "", gstPercentage: undefined }],
      deliveryAddress: "",
      segment: "",
      paymentTerms: "",
      remarks: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const currentItems = form.watch("items");

  const calculateTotalValue = React.useCallback(() => {
    let subTotal = 0;
    let totalGst = 0;
    currentItems.forEach(item => {
      const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
      subTotal += itemTotal;
      if (item.gstPercentage && item.gstPercentage > 0) {
        totalGst += itemTotal * (item.gstPercentage / 100);
      }
    });
    return { subTotal, totalGst, grandTotal: subTotal + totalGst };
  }, [currentItems]);

  const { subTotal, totalGst, grandTotal } = calculateTotalValue();

  function onSubmit(data: PurchaseOrderFormData) {
    console.log("Purchase Order Data:", { ...data, attachmentName: attachments?.name });
    toast({
      title: "Purchase Order Request Submitted",
      description: "Your PO request has been submitted for approval.",
    });
    form.reset();
    setAttachments(null);
  }
  
  const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <ShoppingCart className="w-6 h-6 mr-2 text-primary" /> Create Purchase Order Request
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          This form is to request approval for a new Purchase Order. After internal approval, the PO will be created in SAP, and the SAP PO number will be associated with this request for tracking.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="poCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Tag className="w-4 h-4 mr-1" />PO Category</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Capex, Opex, Services" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Users className="w-4 h-4 mr-1" />Department</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Briefcase className="w-4 h-4 mr-1" />Vendor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="kmKmgCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Hash className="w-4 h-4 mr-1" />KM / KMG Code (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter KM/KMG Code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costCenter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Briefcase className="w-4 h-4 mr-1" />Cost Center</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Cost Center ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ioNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Hash className="w-4 h-4 mr-1" />IO Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Internal Order Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="poDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>PO Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="w-4 h-4 ml-auto opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <h3 className="mb-4 text-lg font-medium text-foreground">Items</h3>
              {fields.map((item, index) => (
                <Card key={item.id} className="p-4 mb-4 border rounded-lg">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                    <FormField
                      control={form.control}
                      name={`items.${index}.itemName`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-4">
                          <FormLabel>Material Description</FormLabel>
                          <FormControl>
                            <Input placeholder="Item name/description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-1">
                          <FormLabel>Qty</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`items.${index}.hsnSacCode`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>HSN/SAC Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 998313" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`items.${index}.gstPercentage`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="flex items-center"><Percent className="w-3 h-3 mr-1" />GST %</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g., 18" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end md:col-span-1">
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} className="w-full">
                        <Trash2 className="w-4 h-4" />
                        <span className="sr-only">Remove Item</span>
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ itemName: "", quantity: 1, unitPrice: 0, hsnSacCode: "", gstPercentage: undefined })}
                className="mt-2"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="p-4 mt-4 border rounded-lg bg-muted/50">
                <h4 className="mb-2 text-md font-semibold text-foreground">PO Value Summary</h4>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span> <span>{subTotal.toLocaleString('en-IN', currencyFormattingOptions)}</span></div>
                    <div className="flex justify-between"><span>Total GST:</span> <span>{totalGst.toLocaleString('en-IN', currencyFormattingOptions)}</span></div>
                    <div className="flex justify-between pt-1 mt-1 border-t border-border">
                        <span className="font-bold">Grand Total:</span>
                        <span className="font-bold">{grandTotal.toLocaleString('en-IN', currencyFormattingOptions)}</span>
                    </div>
                </div>
            </div>


            <FormField
              control={form.control}
              name="deliveryAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Building className="w-4 h-4 mr-1" />Delivery Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full delivery address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="segment"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Tag className="w-4 h-4 mr-1" />Segment (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., R&D, Production Support" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Terms (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Net 30 days" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <FileUpload
              onFileChange={setAttachments}
              label="Attachments (Optional)"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
              dataAiHint="invoice document contract"
            />

            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Info className="w-4 h-4 mr-1" />PO Details / Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special instructions or notes for this PO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-8 border-t">
              <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Purchase Order</>}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

