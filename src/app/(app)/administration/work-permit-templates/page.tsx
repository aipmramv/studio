
// src/app/(app)/administration/work-permit-templates/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, FileCheck, Save, Settings2, ChevronDown, Info } from "lucide-react";
import { MOCK_WORK_PERMIT_TEMPLATES, WORK_PERMIT_FIELD_TYPES, MOCK_STANDARD_PERMIT_SECTIONS, type WorkPermitTemplate, type WorkPermitCustomField } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WorkPermitTemplateMetadataSchema, WorkPermitCustomFieldSchema, type WorkPermitTemplateMetadataFormData, type WorkPermitCustomFieldFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";


export default function WorkPermitTemplatesPage() {
  const [workPermitTemplates, setWorkPermitTemplates] = React.useState<WorkPermitTemplate[]>(MOCK_WORK_PERMIT_TEMPLATES);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<WorkPermitTemplate | null>(null);
  const [editingField, setEditingField] = React.useState<WorkPermitCustomField | null>(null);
  const [currentTemplateForField, setCurrentTemplateForField] = React.useState<WorkPermitTemplate | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<{ type: 'template' | 'field', id: string, parentTemplateId?: string } | null>(null);
  
  const { toast } = useToast();

  const templateForm = useForm<WorkPermitTemplateMetadataFormData>({
    resolver: zodResolver(WorkPermitTemplateMetadataSchema),
    defaultValues: { id: "", name: "" },
  });

  const fieldForm = useForm<WorkPermitCustomFieldFormData>({
    resolver: zodResolver(WorkPermitCustomFieldSchema),
    defaultValues: { id: "", label: "", type: undefined, isRequired: false }
  });

  const openAddTemplateDialog = () => {
    setEditingTemplate(null);
    templateForm.reset({ id: `wpt_${Date.now()}`, name: ""});
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplateDialog = (template: WorkPermitTemplate) => {
    setEditingTemplate(template);
    templateForm.reset({ id: template.id, name: template.name });
    setIsTemplateDialogOpen(true);
  };
  
  const openAddFieldDialog = (template: WorkPermitTemplate) => {
    setCurrentTemplateForField(template);
    setEditingField(null);
    fieldForm.reset({ id: `wpcf_${Date.now()}`, label: "", type: undefined, isRequired: false });
    setIsFieldDialogOpen(true);
  };

  const openEditFieldDialog = (field: WorkPermitCustomField, template: WorkPermitTemplate) => {
    setCurrentTemplateForField(template);
    setEditingField(field);
    fieldForm.reset({ ...field });
    setIsFieldDialogOpen(true);
  };

  const handleDeleteConfirmation = (type: 'template' | 'field', id: string, parentTemplateId?: string) => {
    setItemToDelete({ type, id, parentTemplateId });
  };

  const executeDelete = () => {
    if (!itemToDelete) return;
    const { type, id, parentTemplateId } = itemToDelete;

    if (type === 'template') {
      setWorkPermitTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: "Template Deleted", description: `Work Permit template ${id} has been deleted.` });
    } else if (type === 'field' && parentTemplateId) {
      setWorkPermitTemplates(prev => 
        prev.map(t => 
          t.id === parentTemplateId 
            ? { ...t, customFields: t.customFields.filter(f => f.id !== id) }
            : t
        )
      );
      toast({ title: "Custom Field Deleted", description: `Field ${id} has been deleted.` });
    }
    setItemToDelete(null);
  };

  const handleTemplateFormSubmit = (data: WorkPermitTemplateMetadataFormData) => {
    if (editingTemplate) {
      setWorkPermitTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, name: data.name } : t));
      toast({ title: "Template Updated", description: `Work Permit template ${data.name} updated.` });
    } else {
      const newTemplate: WorkPermitTemplate = { ...data, customFields: [] };
      setWorkPermitTemplates(prev => [...prev, newTemplate]);
      toast({ title: "Template Added", description: `Work Permit template ${data.name} added.` });
    }
    setIsTemplateDialogOpen(false);
    templateForm.reset();
  };
  
  const handleFieldFormSubmit = (data: WorkPermitCustomFieldFormData) => {
    if (!currentTemplateForField) return;

    setWorkPermitTemplates(prev => prev.map(t => {
      if (t.id === currentTemplateForField.id) {
        let updatedFields;
        if (editingField) {
          updatedFields = t.customFields.map(f => f.id === editingField.id ? { ...f, ...data } : f);
        } else {
          updatedFields = [...t.customFields, data];
        }
        return { ...t, customFields: updatedFields };
      }
      return t;
    }));
    
    toast({ title: editingField ? "Field Updated" : "Field Added", description: `Field ${data.label} processed.` });
    setIsFieldDialogOpen(false);
    fieldForm.reset();
    setEditingField(null);
    setCurrentTemplateForField(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Work Permit Print Template Configuration"
        description="Define and manage the structure and content of Work Permit documents for printing."
        actions={
          <Button onClick={openAddTemplateDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Template
          </Button>
        }
      />

      {itemToDelete && (
        <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this {itemToDelete.type}? This action cannot be undone.
                {itemToDelete.type === 'template' && ' Deleting a template will also delete all its custom fields.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <Dialog open={isTemplateDialogOpen} onOpenChange={(isOpen) => {
        setIsTemplateDialogOpen(isOpen);
        if (!isOpen) {
          templateForm.reset();
          setEditingTemplate(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit" : "Add New"} Work Permit Template</DialogTitle>
          </DialogHeader>
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(handleTemplateFormSubmit)} className="space-y-4 py-4">
              <FormField control={templateForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl><Input placeholder="e.g., General Electrical Work Permit" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={templateForm.control} name="id" render={({ field }) => (<Input type="hidden" {...field} />)} />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingTemplate ? "Save Changes" : "Create Template"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFieldDialogOpen} onOpenChange={(isOpen) => {
          setIsFieldDialogOpen(isOpen);
          if(!isOpen) {
            fieldForm.reset();
            setEditingField(null);
            setCurrentTemplateForField(null);
          }
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit" : "Add New"} Custom Field</DialogTitle>
            <DialogDescription>For template: {currentTemplateForField?.name}</DialogDescription>
          </DialogHeader>
          <Form {...fieldForm}>
            <form onSubmit={fieldForm.handleSubmit(handleFieldFormSubmit)} className="space-y-4 py-4">
              <FormField control={fieldForm.control} name="label" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Label</FormLabel>
                    <FormControl><Input placeholder="e.g., Specific Tools Required" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={fieldForm.control} name="id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field ID</FormLabel>
                    <FormControl><Input placeholder="e.g., specific_tools (unique)" {...field} disabled={!!editingField} /></FormControl>
                    <p className="text-xs text-muted-foreground">Unique identifier. Cannot be changed after creation.</p>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={fieldForm.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select field type" /></SelectTrigger></FormControl>
                      <SelectContent>{WORK_PERMIT_FIELD_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={fieldForm.control} name="isRequired" render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Is this field mandatory?</FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
              )}/>
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingField ? "Save Changes" : "Add Field"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {workPermitTemplates.length === 0 ? (
        <Card><CardContent className="p-6 text-center"><p className="text-muted-foreground">No Work Permit templates defined yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-6">
          {workPermitTemplates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl font-headline">
                    <FileCheck className="w-5 h-5 mr-2 text-primary" /> {template.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditTemplateDialog(template)}><Edit className="w-3 h-3 mr-1" /> Edit Template</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation('template', template.id)}><Trash2 className="w-3 h-3 mr-1" /> Delete Template</Button>
                  </div>
                </div>
                 <CardDescription>Template ID: {template.id}</CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full" defaultValue="custom_fields">
                  <AccordionItem value="standard_sections">
                     <AccordionPrimitive.Header className="flex">
                        <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between py-3 font-medium text-base hover:underline [&[data-state=open]>svg]:rotate-180">
                           Standard Sections (Illustrative)
                           <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                        </AccordionPrimitive.Trigger>
                     </AccordionPrimitive.Header>
                    <AccordionContent className="pt-2 pb-1">
                      <p className="text-sm text-muted-foreground mb-2">These are common sections found in work permits. Full customization of these will be part of future enhancements.</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {MOCK_STANDARD_PERMIT_SECTIONS.map(section => (
                              <div key={section.id} className="p-2 border rounded-md bg-background text-xs">
                                  <p className="font-semibold text-foreground">{section.name}</p>
                                  <p className="text-muted-foreground">{section.description}</p>
                              </div>
                          ))}
                       </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="custom_fields" className="mt-4">
                    <AccordionPrimitive.Header className="flex items-center justify-between py-3">
                        <AccordionPrimitive.Trigger className="flex flex-1 items-center text-base font-medium hover:underline [&[data-state=open]>svg]:rotate-180">
                           Custom Fields
                           <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ml-2" />
                        </AccordionPrimitive.Trigger>
                         <Button variant="outline" size="sm" onClick={() => openAddFieldDialog(template)} className="ml-auto"><PlusCircle className="w-3 h-3 mr-1" /> Add Custom Field</Button>
                     </AccordionPrimitive.Header>
                    <AccordionContent className="pt-2 pb-1">
                      {template.customFields.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Label</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Required</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {template.customFields.map((field) => (
                              <TableRow key={field.id}>
                                <TableCell className="font-medium">{field.label}</TableCell>
                                <TableCell><Badge variant="secondary">{field.type}</Badge></TableCell>
                                <TableCell>{field.isRequired ? "Yes" : "No"}</TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => openEditFieldDialog(field, template)}><Edit className="w-3.5 h-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive/80" onClick={() => handleDeleteConfirmation('field', field.id, template.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableCaption>{template.customFields.length} custom field(s) defined.</TableCaption>
                        </Table>
                      ) : (
                        <p className="text-sm text-center text-muted-foreground py-4">No custom fields defined for this template yet.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
