
// src/components/forms/WorkPermitForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";
import { Building, ListChecks, Send, FileText, Loader2, MapPin, CalendarDays, CalendarIcon, Save, Ban } from "lucide-react";
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
import { STORE_LOCATIONS, ACTIVITY_TYPES_WORK_PERMIT } from "@/lib/constants";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface WorkPermitFormProps {
  initialData?: WorkPermitFormData;
  isEditing?: boolean;
  onSave?: (data: WorkPermitFormData) => void;
  onCancel?: () => void;
}

export function WorkPermitForm({ initialData, isEditing, onSave, onCancel }: WorkPermitFormProps) {
  const { toast } = useToast();
  const [attachmentsFile, setAttachmentsFile] = React.useState<File | null>(null);

  const form = useForm<WorkPermitFormData>({
    resolver: zodResolver(WorkPermitSchema),
    defaultValues: initialData || {
      building: undefined,
      activityType: undefined,
      activityDetails: "",
      specificAreaOrEquipment: "",
      permitValidity: undefined,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      // Ensure date is correctly formatted if it's a string from mock data
      const dataToReset = {
        ...initialData,
        permitValidity: initialData.permitValidity ? new Date(initialData.permitValidity) : undefined,
      };
      form.reset(dataToReset);
    }
  }, [initialData, form]);

  function onSubmit(data: WorkPermitFormData) {
     if (isEditing && onSave) {
      onSave(data);
      toast({
        title: "Request Updated",
        description: "Work permit request has been updated.",
      });
    } else if (onSave) { // For new request submission scenario if onSave is provided
      onSave(data);
      toast({
        title: "Request Submitted",
        description: "Work permit request logged successfully and sent for approval.",
      });
      form.reset();
      setAttachmentsFile(null);
    } else { // Fallback for direct usage on /new page
      console.log("Work Permit Data (New):", { ...data, attachments: attachmentsFile?.name });
      toast({
        title: "Request Submitted",
        description: "Work permit request logged successfully and sent for approval.",
      });
      form.reset();
      setAttachmentsFile(null);
    }
  }

  return (
    <Card className="w-full">
      {!isEditing && (
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <FileText className="w-6 h-6 mr-2 text-primary" /> Request Work Permit
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn(isEditing && "pt-6")}>
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
                          <SelectValue placeholder="Select building/location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STORE_LOCATIONS.map((location) => (
                          <SelectItem key={location} value={location}>{location}</SelectItem>
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
