
// src/components/forms/MaterialMovementForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";
import { DollarSign, FilePlus, Package, Save, Send, Truck, ChevronsUpDown, Check, Loader2 } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MaterialMovementSchema, type MaterialMovementFormData } from "@/lib/schemas";
import { MATERIAL_TYPES, DEPARTMENTS } from "@/lib/constants";
import { FileUpload } from "@/components/ui/file-upload";
import { AiComplianceCheck } from "@/components/features/AiComplianceCheck";
import { useToast } from "@/hooks/use-toast";

export function MaterialMovementForm() {
  const { toast } = useToast();
  const [showVehicleNumber, setShowVehicleNumber] = React.useState(false);
  const [eWayBillFile, setEWayBillFile] = React.useState<File | null>(null);

  const form = useForm<MaterialMovementFormData>({
    resolver: zodResolver(MaterialMovementSchema),
    defaultValues: {
      materialType: undefined,
      source: "",
      destination: "",
      quantity: 1,
      value: 0,
      isReturnable: "no",
      vehicleNumber: "",
    },
  });

  const materialValue = form.watch("value");

  React.useEffect(() => {
    if (materialValue > 100000) { 
      setShowVehicleNumber(true);
      if (!form.formState.dirtyFields.vehicleNumber) {
         form.register("vehicleNumber");
      }
    } else {
      setShowVehicleNumber(false);
      if (form.formState.isDirty && form.getValues("vehicleNumber") === "") { 
          form.unregister("vehicleNumber");
      }
    }
  }, [materialValue, form]);

  function onSubmit(data: MaterialMovementFormData) {
    console.log("Material Movement Data:", {...data, eWayBill: eWayBillFile?.name });
    toast({
      title: "Request Submitted",
      description: "Material movement request logged successfully.",
    });
    form.reset();
    setEWayBillFile(null);
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <Package className="w-6 h-6 mr-2 text-primary" /> Log Material Movement
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="materialType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Material Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select material type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MATERIAL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 100" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Department/Location</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                         <SelectItem value="External Vendor">External Vendor</SelectItem>
                         <SelectItem value="Other Site">Other Site</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Department/Location</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                        <SelectItem value="External Customer">External Customer</SelectItem>
                        <SelectItem value="Scrap Yard">Scrap Yard</SelectItem>
                        <SelectItem value="Other Site">Other Site</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><DollarSign className="w-4 h-4 mr-1" />Material Value</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50000" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormDescription>
                      If value &gt; 1,00,000 vehicle number is mandatory.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isReturnable"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Is Returnable?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="yes" />
                          </FormControl>
                          <FormLabel className="font-normal">Yes</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="no" />
                          </FormControl>
                          <FormLabel className="font-normal">No</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {showVehicleNumber && (
                <FormField
                  control={form.control}
                  name="vehicleNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Truck className="w-4 h-4 mr-1" />Vehicle Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., MH01AB1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
               <div className="md:col-span-2">
                <FileUpload 
                  onFileChange={setEWayBillFile} 
                  label="E-Way Bill / Supporting Documents (Optional)"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  dataAiHint="document invoice"
                />
              </div>
            </div>
            
            <AiComplianceCheck formData={form.getValues()} />

            <CardFooter className="px-0 pt-6">
              <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Request</>}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
