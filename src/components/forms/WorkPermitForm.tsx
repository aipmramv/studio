
// src/components/forms/WorkPermitForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";
import { Building, ListChecks, Send, FileText, Loader2, MapPin, CalendarDays, CalendarIcon } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { WorkPermitSchema, type WorkPermitFormData } from "@/lib/schemas";
import { BUILDING_TYPES, ACTIVITY_TYPES_WORK_PERMIT } from "@/lib/constants";
import { FileUpload } from "@/components/ui/file-upload";
import { AiComplianceCheck } from "@/components/features/AiComplianceCheck";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";


export function WorkPermitForm() {
  const { toast } = useToast();
  const [attachmentsFile, setAttachmentsFile] = React.useState<File | null>(null);

  const form = useForm<WorkPermitFormData>({
    resolver: zodResolver(WorkPermitSchema),
    defaultValues: {
      building: undefined,
      activityType: undefined,
      activityDetails: "",
      specificAreaOrEquipment: "",
      permitValidity: undefined,
    },
  });

  function onSubmit(data: WorkPermitFormData) {
    console.log("Work Permit Data:", { ...data, attachments: attachmentsFile?.name });
    toast({
      title: "Request Submitted",
      description: "Work permit request logged successfully.",
    });
    form.reset();
    setAttachmentsFile(null);
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <FileText className="w-6 h-6 mr-2 text-primary" /> Request Work Permit
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="building"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Building className="w-4 h-4 mr-1" />Building/Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select building" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BUILDING_TYPES.map((type) => (
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
                name="activityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><ListChecks className="w-4 h-4 mr-1" />Permit Type / Activity</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity/permit type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ACTIVITY_TYPES_WORK_PERMIT.map((type) => (
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
                name="specificAreaOrEquipment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><MapPin className="w-4 h-4 mr-1" />Specific Area / Equipment ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pump House Room 2 or Equip-ID: EQP-005" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="permitValidity"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center"><CalendarDays className="w-4 h-4 mr-1" />Permit Valid Until (Optional)</FormLabel>
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
              <div className="md:col-span-2">
                 <FormField
                    control={form.control}
                    name="activityDetails" 
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Activity Details & Scope</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Describe the work to be done, specific location, tools, and personnel involved..."
                            className="resize-y min-h-[120px]"
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
               </div>
              <div className="md:col-span-2">
                <FileUpload 
                  onFileChange={setAttachmentsFile} 
                  label="Attachments (Work Orders, Safety Instructions, Diagrams etc.)"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  dataAiHint="safety document diagram"
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
