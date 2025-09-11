// src/components/forms/AssetForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Save, Loader2, Ban, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { AssetManagementSchema, type AssetManagementFormData } from "@/lib/schemas";
import { DEPARTMENTS, TEAMS_AND_TRIBES, ASSET_CLASSIFICATIONS, ASSET_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardFooter } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { FileUpload } from "../ui/file-upload";

interface AssetFormProps {
  initialData?: AssetManagementFormData | null;
  onSave: (data: AssetManagementFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function AssetManagementForm({ initialData, onSave, onCancel, isEditing }: AssetFormProps) {
  const router = useRouter();
  const form = useForm<AssetManagementFormData>({
    resolver: zodResolver(AssetManagementSchema),
    defaultValues: initialData ? 
        Object.fromEntries(Object.entries(initialData).map(([key, value]) => {
            if (key.toLowerCase().includes("date") && value) {
                return [key, new Date(value as string)];
            }
            return [key, value === undefined ? "" : value];
        })) as any
    : {
        assetNumber: "",
        assetDescription: "",
        department: undefined,
        location: "",
        ledgerQty: 1,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)}>
      <ScrollArea className="h-[70vh] pr-4">
        <Card className="w-full border-0 shadow-none">
          <CardContent className="pt-6 space-y-6">
            
            {/* Core Info */}
            <div className="p-4 border rounded-md">
              <h3 className="mb-4 text-lg font-medium">Core Information</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField control={form.control} name="assetNumber" render={({ field }) => (
                    <FormItem><FormLabel>Asset Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="materialCode" render={({ field }) => (
                    <FormItem><FormLabel>Material Code (KM)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="assetDescription" render={({ field }) => (
                    <FormItem className="md:col-span-2 lg:col-span-3"><FormLabel>Asset Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
              </div>
            </div>

            {/* Classification */}
            <div className="p-4 border rounded-md">
                <h3 className="mb-4 text-lg font-medium">Classification & Grouping</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="assetClassification" render={({ field }) => (
                        <FormItem><FormLabel>Asset Classification</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Classification" /></SelectTrigger></FormControl>
                            <SelectContent>{ASSET_CLASSIFICATIONS.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                          </Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="assetGrouping" render={({ field }) => (
                        <FormItem><FormLabel>Asset Grouping</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>

            {/* Financial & Lifecycle */}
            <div className="p-4 border rounded-md">
                <h3 className="mb-4 text-lg font-medium">Financial & Lifecycle</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <FormField control={form.control} name="capitalizationDate" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Capitalization Date</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="w-4 h-4 ml-auto opacity-50" /></Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                    )}/>
                     <FormField control={form.control} name="lifecycleYears" render={({ field }) => (
                        <FormItem><FormLabel>Asset Life (Years)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="purchaseValue" render={({ field }) => (
                        <FormItem><FormLabel>Purchase Value (INR)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>
            
            {/* Details & Spec */}
            <div className="p-4 border rounded-md">
                 <h3 className="mb-4 text-lg font-medium">Details & Specification</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <FormField control={form.control} name="brandName" render={({ field }) => (
                        <FormItem><FormLabel>Brand Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="modelNo" render={({ field }) => (
                        <FormItem><FormLabel>Model No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="productSerialNo" render={({ field }) => (
                        <FormItem><FormLabel>Product Serial No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="ledgerQty" render={({ field }) => (
                        <FormItem><FormLabel>Ledger Quantity</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>

            {/* Custody & Usage */}
            <div className="p-4 border rounded-md">
                <h3 className="mb-4 text-lg font-medium">Custody & Usage</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <FormField control={form.control} name="personResponsible" render={({ field }) => (
                        <FormItem><FormLabel>Person Responsible (Custodian)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="currentUser" render={({ field }) => (
                        <FormItem><FormLabel>Current User</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="department" render={({ field }) => (
                        <FormItem><FormLabel>Department</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger></FormControl>
                            <SelectContent>{DEPARTMENTS.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="assetCoordinator" render={({ field }) => (
                        <FormItem><FormLabel>Asset Co-ordinator</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="teamOrTribe" render={({ field }) => (
                        <FormItem><FormLabel>Team / Tribe</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Team/Tribe" /></SelectTrigger></FormControl>
                            <SelectContent>{TEAMS_AND_TRIBES.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                          </Select>
                        <FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="onGoingProject" render={({ field }) => (
                        <FormItem><FormLabel>On-going Project</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="weeklyUsageFrequency" render={({ field }) => (
                        <FormItem><FormLabel>Weekly Usage (Days)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>

            {/* Location */}
            <div className="p-4 border rounded-md">
                <h3 className="mb-4 text-lg font-medium">Location</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <FormField control={form.control} name="location" render={({ field }) => (
                        <FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="floor" render={({ field }) => (
                        <FormItem><FormLabel>Floor</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="laboratory" render={({ field }) => (
                        <FormItem><FormLabel>Laboratory</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>

            {/* Verification & Condition */}
             <div className="p-4 border rounded-md">
                <h3 className="mb-4 text-lg font-medium">Verification & Condition</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                     <FormField control={form.control} name="currentStatus" render={({ field }) => (
                        <FormItem><FormLabel>Current Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl>
                            <SelectContent>{ASSET_STATUSES.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="verificationStatus" render={({ field }) => (
                        <FormItem><FormLabel>Verification Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Verified">Verified</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Discrepancy">Discrepancy</SelectItem></SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="verifiedOn" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Verified On</FormLabel>
                        <Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="w-4 h-4 ml-auto opacity-50" /></Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="usableCondition" render={({ field }) => (
                        <FormItem><FormLabel>Usable Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Condition" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Yes">Yes</SelectItem><SelectItem value="No">No</SelectItem><SelectItem value="Partial">Partial</SelectItem></SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="workingConditionStatus" render={({ field }) => (
                        <FormItem><FormLabel>Working Condition</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger></FormControl>
                            <SelectContent><SelectItem value="Working">Working</SelectItem><SelectItem value="Not Working">Not Working</SelectItem><SelectItem value="Under Maintenance">Under Maintenance</SelectItem></SelectContent>
                        </Select><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="comments" render={({ field }) => (
                        <FormItem className="md:col-span-2 lg:col-span-3"><FormLabel>Condition Comments</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
            </div>

             <div className="p-4 border rounded-md">
                <h3 className="mb-4 text-lg font-medium">Attachments</h3>
                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="attachments.invoice" render={({ field }) => (
                        <FormItem><FormLabel>Invoice</FormLabel><FileUpload onFileChange={field.onChange} /></FormItem>
                    )}/>
                     <FormField control={form.control} name="attachments.warranty" render={({ field }) => (
                        <FormItem><FormLabel>Warranty Certificate</FormLabel><FileUpload onFileChange={field.onChange} /></FormItem>
                    )}/>
                     <FormField control={form.control} name="attachments.calibration" render={({ field }) => (
                        <FormItem><FormLabel>Calibration Certificate</FormLabel><FileUpload onFileChange={field.onChange} /></FormItem>
                    )}/>
                     <FormField control={form.control} name="attachments.photo" render={({ field }) => (
                        <FormItem><FormLabel>Asset Photo</FormLabel><FileUpload onFileChange={field.onChange} accept="image/*" /></FormItem>
                    )}/>
                 </div>
            </div>

          </CardContent>
          <CardFooter className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting}><Ban className="w-4 h-4 mr-2"/>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin"/>Saving...</> : <><Save className="w-4 h-4 mr-2"/>Save Asset</>}
            </Button>
          </CardFooter>
        </Card>
        </ScrollArea>
      </form>
    </Form>
  );
}
