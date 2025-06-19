
// src/components/forms/ScrapMovementForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as React from "react";
import { PackageSearch, Scale, Send, Image as ImageIcon, Edit3, Loader2 } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { ScrapMovementSchema, type ScrapMovementFormData } from "@/lib/schemas";
import { SCRAP_TYPES } from "@/lib/constants";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";

export function ScrapMovementForm() {
  const { toast } = useToast();
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);

  const form = useForm<ScrapMovementFormData>({
    resolver: zodResolver(ScrapMovementSchema),
    defaultValues: {
      scrapType: undefined,
      description: "",
      quantity: 1,
      weight: 0.1,
    },
  });

  function onSubmit(data: ScrapMovementFormData) {
    // Simulate Housekeeping segregation, Security weighing & photo - these are operational.
    // The form captures the outcome.
    console.log("Scrap Movement Data (after mock operational steps):", { ...data, photo: photoFile?.name });
    toast({
      title: "Request Submitted",
      description: "Scrap disposal request logged successfully and sent for approval.",
    });
    form.reset();
    setPhotoFile(null);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl font-headline">
          <PackageSearch className="w-6 h-6 mr-2 text-primary" /> Log Scrap Disposal Request
        </CardTitle>
        <CardDescription>
          Select scrap type, enter description, quantity, and weight. Attach photos or documents (e.g., weight measurement photo).
          Operational steps like segregation by Housekeeping and weighing in presence of Security are assumed before or during this request.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="scrapType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scrap Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select scrap type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SCRAP_TYPES.map((type) => (
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
                    <FormLabel>Quantity (Units/Pieces)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Scale className="w-4 h-4 mr-1" /> Weight (e.g., KG, Tons)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="e.g., 50.5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center"><Edit3 className="w-4 h-4 mr-1" /> Description</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Detailed description of the scrap material..."
                            className="resize-y min-h-[100px]"
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
                  onFileChange={setPhotoFile} 
                  label="Photo for Weight Measurement / Supporting Documents (Optional)"
                  accept="image/*,.pdf,.doc,.docx"
                  dataAiHint="scrap weight document"
                />
              </div>
            </div>
            
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
