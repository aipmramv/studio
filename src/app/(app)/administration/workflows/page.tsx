
// src/app/(app)/administration/workflows/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Workflow as WorkflowIcon, Save, ChevronDown } from "lucide-react";
import { MOCK_WORKFLOW_TEMPLATES, type WorkflowTemplate, type WorkflowStep, REQUEST_TYPES, USER_ROLES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  // AccordionTrigger, // We will use AccordionPrimitive.Trigger directly for the custom part
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
import { WorkflowTemplateSchema, WorkflowStepSchema, type WorkflowTemplateFormData, type WorkflowStepFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";


export default function WorkflowConfigurationPage() {
  const [workflowTemplates, setWorkflowTemplates] = React.useState<WorkflowTemplate[]>(MOCK_WORKFLOW_TEMPLATES);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = React.useState(false);
  const [isStepDialogOpen, setIsStepDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<WorkflowTemplate | null>(null);
  const [editingStep, setEditingStep] = React.useState<WorkflowStep | null>(null);
  const [currentTemplateForStep, setCurrentTemplateForStep] = React.useState<WorkflowTemplate | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<{ type: 'template' | 'step', id: string, parentTemplateId?: string } | null>(null);
  
  const { toast } = useToast();

  const templateForm = useForm<WorkflowTemplateFormData>({
    resolver: zodResolver(WorkflowTemplateSchema),
    defaultValues: { id: "", name: "", requestType: undefined, initialStepId: "" },
  });

  const stepForm = useForm<WorkflowStepFormData>({
    resolver: zodResolver(WorkflowStepSchema),
    defaultValues: { id: "", name: "", assignedRoles: [], nextStepId: "", rejectionLeadsToStepId: "" }
  });

  const openAddTemplateDialog = () => {
    setEditingTemplate(null);
    templateForm.reset({ id: `wt_${Date.now()}`, name: "", requestType: undefined, initialStepId: "" });
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplateDialog = (template: WorkflowTemplate) => {
    setEditingTemplate(template);
    templateForm.reset({ ...template });
    setIsTemplateDialogOpen(true);
  };
  
  const openAddStepDialog = (template: WorkflowTemplate) => {
    setCurrentTemplateForStep(template);
    setEditingStep(null);
    stepForm.reset({ id: `ws_${Date.now()}`, name: "", assignedRoles: [], nextStepId: "", rejectionLeadsToStepId: "" });
    setIsStepDialogOpen(true);
  };

  const openEditStepDialog = (step: WorkflowStep, template: WorkflowTemplate) => {
    setCurrentTemplateForStep(template);
    setEditingStep(step);
    stepForm.reset({ ...step });
    setIsStepDialogOpen(true);
  };

  const handleDeleteConfirmation = (type: 'template' | 'step', id: string, parentTemplateId?: string) => {
    setItemToDelete({ type, id, parentTemplateId });
  };

  const executeDelete = () => {
    if (!itemToDelete) return;
    const { type, id, parentTemplateId } = itemToDelete;

    if (type === 'template') {
      setWorkflowTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: "Template Deleted", description: `Workflow template ${id} has been deleted.` });
    } else if (type === 'step' && parentTemplateId) {
      setWorkflowTemplates(prev => 
        prev.map(t => 
          t.id === parentTemplateId 
            ? { ...t, steps: t.steps.filter(s => s.id !== id), initialStepId: t.initialStepId === id ? "" : t.initialStepId } 
            : t
        )
      );
      toast({ title: "Step Deleted", description: `Workflow step ${id} has been deleted.` });
    }
    setItemToDelete(null);
  };

  const handleTemplateFormSubmit = (data: WorkflowTemplateFormData) => {
    if (editingTemplate) {
      setWorkflowTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...data, steps: t.steps } : t)); // Keep existing steps
      toast({ title: "Template Updated", description: `Workflow template ${data.name} updated.` });
    } else {
      const newTemplate: WorkflowTemplate = { ...data, steps: [] }; // New templates start with no steps
      setWorkflowTemplates(prev => [...prev, newTemplate]);
      toast({ title: "Template Added", description: `Workflow template ${data.name} added.` });
    }
    setIsTemplateDialogOpen(false);
    templateForm.reset();
  };
  
  const handleStepFormSubmit = (data: WorkflowStepFormData) => {
    if (!currentTemplateForStep) return;

    setWorkflowTemplates(prev => prev.map(t => {
      if (t.id === currentTemplateForStep.id) {
        let updatedSteps;
        if (editingStep) {
          updatedSteps = t.steps.map(s => s.id === editingStep.id ? { ...s, ...data } : s);
        } else {
          updatedSteps = [...t.steps, data];
        }
        return { ...t, steps: updatedSteps };
      }
      return t;
    }));
    
    toast({ title: editingStep ? "Step Updated" : "Step Added", description: `Step ${data.name} processed.` });
    setIsStepDialogOpen(false);
    stepForm.reset();
    setEditingStep(null);
    setCurrentTemplateForStep(null);
  };

  const renderStepDetails = (step: WorkflowStep) => {
    return (
      <div className="p-3 my-1 space-y-1 rounded-md bg-muted/50">
        <p className="text-sm"><strong className="text-foreground">Step ID:</strong> {step.id}</p>
        <p className="text-sm"><strong className="text-foreground">Assigned Roles:</strong> {step.assignedRoles.join(", ")}</p>
        {step.nextStepId && <p className="text-sm"><strong className="text-foreground">Next (Approve):</strong> {workflowTemplates.flatMap(wt => wt.steps).find(s => s.id === step.nextStepId)?.name || step.nextStepId}</p>}
        {step.rejectionLeadsToStepId && <p className="text-sm"><strong className="text-foreground">Next (Reject):</strong> {workflowTemplates.flatMap(wt => wt.steps).find(s => s.id === step.rejectionLeadsToStepId)?.name || step.rejectionLeadsToStepId}</p>}
        {!step.nextStepId && <Badge variant="outline">Final Approval Step</Badge>}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workflow Configuration"
        description="Define and manage approval workflows for different request types."
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
                {itemToDelete.type === 'template' && ' Deleting a template will also delete all its steps.'}
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
            <DialogTitle>{editingTemplate ? "Edit" : "Add New"} Workflow Template</DialogTitle>
            <DialogDescription>
              {editingTemplate ? "Modify the details of this workflow template." : "Create a new workflow template to define an approval process."}
            </DialogDescription>
          </DialogHeader>
          <Form {...templateForm}>
            <form onSubmit={templateForm.handleSubmit(handleTemplateFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={templateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., High Value PO Approval" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="requestType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select request type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REQUEST_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="initialStepId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Step</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value} 
                      disabled={!editingTemplate?.steps.length && !currentTemplateForStep?.steps.length}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select initial step (after adding steps)" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         {(editingTemplate || currentTemplateForStep)?.steps.map(step => <SelectItem key={step.id} value={step.id}>{step.name} ({step.id})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Set this after adding steps to the template. Must match one of the step IDs.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={templateForm.control}
                name="id"
                render={({ field }) => (<Input type="hidden" {...field} />)}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" /> {editingTemplate ? "Save Changes" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isStepDialogOpen} onOpenChange={(isOpen) => {
          setIsStepDialogOpen(isOpen);
          if(!isOpen) {
            stepForm.reset();
            setEditingStep(null);
            setCurrentTemplateForStep(null);
          }
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStep ? "Edit" : "Add New"} Workflow Step</DialogTitle>
            <DialogDescription>
              Define the details for this step in the workflow: {currentTemplateForStep?.name}.
            </DialogDescription>
          </DialogHeader>
          <Form {...stepForm}>
            <form onSubmit={stepForm.handleSubmit(handleStepFormSubmit)} className="space-y-4 py-4">
              <FormField
                control={stepForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Finance Review" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., finance_review (unique)" {...field} disabled={!!editingStep} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Unique identifier for this step. Cannot be changed after creation.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="assignedRoles"
                render={() => (
                  <FormItem>
                    <FormLabel>Assigned Roles</FormLabel>
                    <ScrollArea className="h-32 border rounded-md">
                      <div className="p-4 space-y-2">
                      {USER_ROLES.map(role => (
                        <FormField
                          key={role}
                          control={stepForm.control}
                          name="assignedRoles"
                          render={({ field }) => {
                            return (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), role])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== role
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm">
                                  {role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ')}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                      </div>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="nextStepId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Step (on Approve)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select next step or leave blank if final" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None (Final Approval)</SelectItem>
                        {currentTemplateForStep?.steps.filter(s => s.id !== editingStep?.id).map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>)}
                      </SelectContent>
                    </Select>
                     <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stepForm.control}
                name="rejectionLeadsToStepId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Step (on Reject)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} >
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select step for rejection flow or leave blank" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None (Ends Workflow or Reverts to Requester)</SelectItem>
                        {currentTemplateForStep?.steps.filter(s => s.id !== editingStep?.id).map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.id})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" /> {editingStep ? "Save Changes" : "Add Step"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {workflowTemplates.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <WorkflowIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold text-foreground">No Workflow Templates</h3>
            <p className="text-muted-foreground">Create your first workflow template to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {workflowTemplates.map((template) => (
            <Card key={template.id} className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-xl font-headline">
                    <WorkflowIcon className="w-5 h-5 mr-2 text-primary" /> {template.name}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditTemplateDialog(template)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit Template
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteConfirmation('template', template.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete Template
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Request Type: <Badge variant="secondary">{template.requestType}</Badge> | Initial Step: <Badge variant="outline">{template.steps.find(s => s.id === template.initialStepId)?.name || template.initialStepId || "Not Set"}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-base font-semibold text-foreground">Approval Steps:</h4>
                    <Button variant="outline" size="sm" onClick={() => openAddStepDialog(template)}>
                        <PlusCircle className="w-3 h-3 mr-1" /> Add Step
                    </Button>
                </div>
                {template.steps.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full" defaultValue={template.steps[0]?.id}>
                    {template.steps.map((step, index) => (
                       <AccordionItem value={step.id} key={step.id} className="mb-2 border rounded-md overflow-hidden">
                        <AccordionPrimitive.Header className={cn("flex items-center justify-between px-4 py-2 rounded-t-md hover:bg-accent/50 bg-card", {"border-b border-border": template.steps.find(s => s.id === step.id) } )}>
                          <AccordionPrimitive.Trigger
                            className={cn(
                              "flex flex-1 items-center text-base font-medium text-left focus:outline-none rounded-sm py-1",
                              "hover:underline",
                              "[&>svg]:transition-transform [&>svg]:duration-200 [&[data-state=open]>svg]:rotate-180"
                            )}
                          >
                            <span className="flex items-center flex-grow">
                              <span className="mr-2 text-primary">{index + 1}.</span> {step.name} {template.initialStepId === step.id && <Badge variant="default" className="ml-2">Initial</Badge>}
                            </span>
                            <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                          </AccordionPrimitive.Trigger>
                      
                          <div className="flex gap-1 ml-3 shrink-0">
                              <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => { openEditStepDialog(step, template); }}>
                                  <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="w-7 h-7 text-destructive hover:text-destructive/80" onClick={() => { handleDeleteConfirmation('step', step.id, template.id); }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                          </div>
                        </AccordionPrimitive.Header>
                        <AccordionContent className="px-4 pt-2 pb-3 bg-card border-t">
                          {renderStepDetails(step)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-sm text-center text-muted-foreground py-4">No steps defined for this workflow. Click "Add Step" to begin.</p>
                )}
              </CardContent>
               <CardFooter>
                <p className="text-xs text-muted-foreground">Template ID: {template.id}</p>
               </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


    