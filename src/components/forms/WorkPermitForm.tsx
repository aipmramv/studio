// src/components/forms/WorkPermitForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";
import { Building, ListChecks, Send, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { WorkPermitSchema, type WorkPermitFormData } from "@/lib/schemas";
import { BUILDING_TYPES, ACTIVITY_TYPES_WORK_PERMIT } from "@/lib/constants";
import { FileUpload } from "@/components/ui/file-upload";
import { AiComplianceCheck } from "@/components/features/AiComplianceCheck";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "../ui/textarea";

export function WorkPermitForm() {
  const { toast } = useToast();
  const [attachmentsFile, setAttachmentsFile] = React.useState<File | null>(null);

  const form = useForm<WorkPermitFormData>({
    resolver: zodResolver(WorkPermitSchema),
    defaultValues: {
      building: undefined,
      activityType: undefined,
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
                    <FormLabel className="flex items-center"><ListChecks className="w-4 h-4 mr-1" />Activity Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select activity type" />
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
               <div className="md:col-span-2">
                 <FormField
                    control={form.control}
                    name="activityDetails" // Add this field to schema if it's needed
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
                  dataAiHint="safety document"
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

// Add activityDetails to WorkPermitSchema in schemas.ts:
// export const WorkPermitSchema = z.object({
//   building: z.enum(BUILDING_TYPES, { required_error: "Building is required." }),
//   activityType: z.enum(ACTIVITY_TYPES_WORK_PERMIT, { required_error: "Activity type is required." }),
//   activityDetails: z.string().min(10, "Please provide more details about the activity.").max(1000, "Details are too long."),
//   // attachments: z.instanceof(File).optional(),
// });
