
// src/components/forms/SaleOrderForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as React from "react";
import { CalendarIcon, DollarSign, PlusCircle, Send, Tags, Trash2, User, Home, Loader2, FileText, Target, Briefcase, Hash, CalendarClock, UserCheck, MessageSquare, Tag } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { SaleOrderSchema, type SaleOrderFormData } from "@/lib/schemas";
import { CURRENCIES, CURRENCY_SYMBOLS, type Currency } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function SaleOrderForm() {
  const { toast } = useToast();

  const form = useForm<SaleOrderFormData>({
    resolver: zodResolver(SaleOrderSchema),
    defaultValues: {
      customerName: "",
      soDate: new Date(),
      projectOrCrNo: "",
      saleOrderCategory: "",
      purpose: "",
      costCenter: "",
      ioNumber: "",
      currency: "INR",
      budgetAmount: 0,
      materialRequiredDate: new Date(),
      departmentHeadApproval: "",
      deliveryTo: "",
      items: [{ itemName: "", quantity: 1, unitPrice: 0 }],
      shippingAddress: "",
      billingAddress: "",
      remarks: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedCurrency = form.watch("currency") as Currency;

  function onSubmit(data: SaleOrderFormData) {
    console.log("Sale Order Data:", data);
    toast({
      title: "Sale Order Submitted",
      description: "SO has been created successfully.",
    });
    form.reset();
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <Tags className="w-6 h-6 mr-2 text-primary" /> Create Sale Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="w-4 h-4 mr-1"/>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="soDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>SO Date</FormLabel>
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

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="projectOrCrNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><FileText className="w-4 h-4 mr-1"/>Project or CR No.</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Project or CR No." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="saleOrderCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Tag className="w-4 h-4 mr-1"/>Sale Order Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Sale Order Category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Target className="w-4 h-4 mr-1"/>Purpose</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the purpose of this sale order" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="costCenter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Briefcase className="w-4 h-4 mr-1"/>Cost Center</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Cost Center" {...field} />
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
                    <FormLabel className="flex items-center"><Hash className="w-4 h-4 mr-1"/>IO Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter IO Number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="budgetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><DollarSign className="w-4 h-4 mr-1"/>Budget Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency} ({CURRENCY_SYMBOLS[currency]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
               <FormField
                control={form.control}
                name="materialRequiredDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center"><CalendarClock className="w-4 h-4 mr-1"/>Material Required Date</FormLabel>
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
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departmentHeadApproval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><UserCheck className="w-4 h-4 mr-1"/>Department Head Approval</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter approving Department Head name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
             <FormField
                control={form.control}
                name="deliveryTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><User className="w-4 h-4 mr-1"/>Delivery To (Contact/Dept)</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact person or department for delivery" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />


            <div>
              <h3 className="mb-2 text-lg font-medium">Material Purchase List / Items</h3>
              {fields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 gap-4 p-4 mb-4 border rounded-md md:grid-cols-7">
                  <FormField
                    control={form.control}
                    name={`items.${index}.itemName`}
                    render={({ field }) => (
                      <FormItem className="md:col-span-3">
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Product/Service name" {...field} />
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
                        <FormLabel>Unit Price ({CURRENCY_SYMBOLS[selectedCurrency]})</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
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
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ itemName: "", quantity: 1, unitPrice: 0 })}
                className="mt-2"
              >
                <PlusCircle className="w-4 h-4 mr-2" /> Add Item
              </Button>
            </div>

            <FormField
              control={form.control}
              name="shippingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Home className="w-4 h-4 mr-1"/>Shipping Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full shipping address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billingAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><Home className="w-4 h-4 mr-1"/>Billing Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full billing address (if different from shipping)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center"><MessageSquare className="w-4 h-4 mr-1"/>Remarks (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any special instructions or remarks for this sale order" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-6">
              <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Sale Order</>}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

