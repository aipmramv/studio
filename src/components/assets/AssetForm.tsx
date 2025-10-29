'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, X, CalendarIcon, Tag, Hash, Users, Building, Package, AlignLeft, List, CheckCircle, Save, Ban } from 'lucide-react'
import { AssetData } from '@/types/asset'
import { AssetManagementSchema, AssetManagementFormData } from '@/lib/schemas'
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface AssetFormProps {
  initialData?: AssetManagementFormData;
  isEditing?: boolean;
  onSave: (data: AssetManagementFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssetForm({ initialData, isEditing, onSave, onCancel, isLoading = false }: AssetFormProps) {
  const form = useForm<AssetManagementFormData>({
    resolver: zodResolver(AssetManagementSchema),
    defaultValues: initialData ? 
      { ...initialData, 
        capitalization_date: initialData.capitalization_date ? new Date(initialData.capitalization_date) : undefined,
        eol_date: initialData.eol_date ? new Date(initialData.eol_date) : undefined,
        verified_on: initialData.verified_on ? new Date(initialData.verified_on) : undefined,
        status_changed_on: initialData.status_changed_on ? new Date(initialData.status_changed_on) : undefined,
      } 
      : {
        asset_number: "",
        asset_description: "",
        asset_classification_id: 0,
        ledger_qty: 1,
        department_id: 0,
        location_id: 0,
        current_status_id: 0,
      },
  });

  // Dummy data for select fields - replace with actual API calls or constants
  const departments = [
    { id: 1, name: "Engineering" },
    { id: 2, name: "Operations" },
    { id: 3, name: "Finance" },
  ];
  const locations = [
    { id: 1, name: "Building A" },
    { id: 2, name: "Building B" },
  ];
  const assetClassifications = [
    { id: 1, name: "Electronics" },
    { id: 2, name: "Furniture" },
    { id: 3, name: "Vehicles" },
  ];
  const assetStatuses = [
    { id: 1, name: "Active" },
    { id: 2, name: "In Maintenance" },
    { id: 3, name: "Retired" },
  ];

  const onFormSubmit = async (data: AssetManagementFormData) => {
    try {
      await onSave(data)
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  React.useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        capitalization_date: initialData.capitalization_date ? new Date(initialData.capitalization_date) : undefined,
        eol_date: initialData.eol_date ? new Date(initialData.eol_date) : undefined,
        verified_on: initialData.verified_on ? new Date(initialData.verified_on) : undefined,
        status_changed_on: initialData.status_changed_on ? new Date(initialData.status_changed_on) : undefined,
      });
    }
  }, [initialData, form]);

  return (
    <Card className="w-full shadow-xl">
      {!isEditing && (
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline">
            <Package className="w-6 h-6 mr-2 text-primary" /> Create New Asset
          </CardTitle>
          <CardDescription>
            Fill in the details below to create a new asset record.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn(isEditing && "pt-6")}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="asset_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Hash className="w-4 h-4 mr-1" />Asset Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., AST-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="asset_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><AlignLeft className="w-4 h-4 mr-1" />Asset Description</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Laptop for software development" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="asset_classification_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><List className="w-4 h-4 mr-1" />Asset Classification</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetClassifications.map((classification) => (
                          <SelectItem key={classification.id} value={String(classification.id)}>
                            {classification.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Users className="w-4 h-4 mr-1" />Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem key={department.id} value={String(department.id)}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Building className="w-4 h-4 mr-1" />Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={String(location.id)}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="current_status_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><CheckCircle className="w-4 h-4 mr-1" />Current Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ? String(field.value) : ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assetStatuses.map((status) => (
                          <SelectItem key={status.id} value={String(status.id)}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ledger_qty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center"><Tag className="w-4 h-4 mr-1" />Ledger Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capitalization_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Capitalization Date</FormLabel>
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
                              format(new Date(field.value), "PPP")
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
                          selected={field.value ? new Date(field.value) : undefined}
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
                name="eol_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>EOL Date</FormLabel>
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
                              format(new Date(field.value), "PPP")
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
                          selected={field.value ? new Date(field.value) : undefined}
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
                name="verified_on"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Verified On</FormLabel>
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
                              format(new Date(field.value), "PPP")
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
                          selected={field.value ? new Date(field.value) : undefined}
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
                name="status_changed_on"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Status Changed On</FormLabel>
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
                              format(new Date(field.value), "PPP")
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
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <CardFooter className="px-0 pt-8 border-t flex justify-end gap-2">
               {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} disabled={form.formState.isSubmitting || isLoading}>
                  <Ban className="w-4 h-4 mr-2" /> Cancel
                </Button>
              )}
              <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting || isLoading}>
                {(form.formState.isSubmitting || isLoading) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : (isEditing ? <><Save className="w-4 h-4 mr-2" /> Save Changes</> : <><Package className="w-4 h-4 mr-2" /> Create Asset</>)}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}