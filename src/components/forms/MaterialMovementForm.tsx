
// src/components/forms/MaterialMovementForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";
import { FilePlus, Package, Save, Send, Truck, ChevronsUpDown, Check, Loader2, Ban } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { MaterialMovementSchema, type MaterialMovementFormData } from "@/lib/schemas";
import { MATERIAL_TYPES, DEPARTMENTS, STORE_LOCATIONS } from "@/lib/constants";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils"; // Added missing import

interface MaterialMovementFormProps {
  initialData?: MaterialMovementFormData;
  isEditing?: boolean;
  onSave?: (data: MaterialMovementFormData) => void;
  onCancel?: () => void;
}

export function MaterialMovementForm({ initialData, isEditing, onSave, onCancel }: MaterialMovementFormProps) {
  const { toast } = useToast();
  const [showVehicleNumber, setShowVehicleNumber] = React.useState(false);
  const [eWayBillFile, setEWayBillFile] = React.useState<File | null>(null);

  const form = useForm<MaterialMovementFormData>({
    resolver: zodResolver(MaterialMovementSchema),
    defaultValues: initialData || {
      materialType: undefined,
      source: "",
      destination: "",
      quantity: 1,
      value: 0,
      isReturnable: "no",
      vehicleNumber: "",
    },
  });

  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
       // Set initial state for vehicle number display based on existing data
      if (initialData.value > 100000) {
        setShowVehicleNumber(true);
      } else {
        setShowVehicleNumber(false);
      }
    }
  }, [initialData, form]);

  const materialValue = form.watch("value");

  React.useEffect(() => {
    if (materialValue > 100000) {
      setShowVehicleNumber(true);
      // Ensure vehicleNumber is registered if it becomes mandatory and wasn't already
      if (!form.formState.dirtyFields.vehicleNumber && !initialData?.vehicleNumber) {
         // form.register("vehicleNumber"); // This might not be needed if zod schema handles optionality correctly
      }
    } else {
      setShowVehicleNumber(false);
      // If value drops and vehicleNumber was not part of initialData or explicitly set, unregister or clear it if schema allows
      // This part is tricky as unregistering can lead to issues if not handled carefully with zod.
      // For now, we just hide it. The schema already makes it optional.
    }
  }, [materialValue, form, initialData]);

  function onSubmit(data: MaterialMovementFormData) {
    // Ensure vehicleNumber is empty if not shown, to align with schema optionality logic
    const submissionData = {
      ...data,
      vehicleNumber: showVehicleNumber ? data.vehicleNumber : "",
    };

    if (isEditing && onSave) {
      onSave(submissionData);
    } else if (onSave) { // For new request submission scenario if onSave is provided
      onSave(submissionData);
      form.reset({
        materialType: undefined,
        source: "",
        destination: "",
        quantity: 1,
        value: 0,
        isReturnable: "no",
        vehicleNumber: "",
      });
      setEWayBillFile(null);
    } else { // Fallback for direct usage on /new page
       console.log("Material Movement Data (New):", {...submissionData, eWayBill: eWayBillFile?.name });
       toast({
         title: "Request Submitted",
         description: "Material movement request logged and sent for approval and receipt confirmation.",
       });
       form.reset({
        materialType: undefined,
        source: "",
        destination: "",
        quantity: 1,
        value: 0,
        isReturnable: "no",
        vehicleNumber: "",
      });
       setEWayBillFile(null);
    }
  }

  return (
    <Card className="w-full">
      {!isEditing && (
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <Package className="w-6 h-6 mr-2 text-primary" /> Log Material Movement Request
          </CardTitle>
          <CardDescription>
            Fill the form with source, destination, item details, quantity, and value. Choose if the material is returnable.
            If value &gt; 1,00,000 INR vehicle number is mandatory. Upload E-Way bill if applicable. The request will include approval and receipt confirmation steps.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn(isEditing && "pt-6")}>
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
                    <FormLabel>Source Location</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STORE_LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
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
                    <FormLabel>Destination Location</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select destination location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {STORE_LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                        ))}
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
                    <FormLabel className="flex items-center">Material Value (INR)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50000" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </FormControl>
                    <FormDescription>
                      If value &gt; 1,00,000 INR vehicle number is mandatory.
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

            <CardFooter className="px-0 pt-6 flex justify-end gap-2">
              {isEditing && onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}>
                  <Ban className="w-4 h-4 mr-2" /> Cancel
                </Button>
              )}
              <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : (isEditing ? <><Save className="w-4 h-4 mr-2" /> Save Changes</> : <><Send className="w-4 h-4 mr-2" /> Submit Request</>)}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

