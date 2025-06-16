
// src/app/(app)/administration/workflows/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Workflow as WorkflowIcon, Users, ArrowRight } from "lucide-react";
import { MOCK_WORKFLOW_TEMPLATES, type WorkflowTemplate, type WorkflowStep } from "@/lib/constants";
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
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function WorkflowConfigurationPage() {
  const [workflowTemplates, setWorkflowTemplates] = React.useState<WorkflowTemplate[]>(MOCK_WORKFLOW_TEMPLATES);

  // In a real app, these would interact with a backend to save changes
  const handleAddTemplate = () => {
    // Mock: Add a new blank template or open a creation dialog
    console.log("Add new workflow template initiated");
  };

  const handleEditTemplate = (templateId: string) => {
    console.log("Edit workflow template initiated for:", templateId);
  };

  const handleDeleteTemplate = (templateId: string) => {
    console.log("Delete workflow template initiated for:", templateId);
    setWorkflowTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const renderStepDetails = (step: WorkflowStep) => {
    return (
      <div className="p-3 my-1 space-y-1 rounded-md bg-muted/50">
        <p className="text-sm"><strong className="text-foreground">Step ID:</strong> {step.id}</p>
        <p className="text-sm"><strong className="text-foreground">Assigned Roles:</strong> {step.assignedRoles.join(", ")}</p>
        {step.nextStepId && <p className="text-sm"><strong className="text-foreground">Next Step (on Approve):</strong> {step.nextStepId}</p>}
        {step.rejectionLeadsToStepId && <p className="text-sm"><strong className="text-foreground">Next Step (on Reject):</strong> {step.rejectionLeadsToStepId}</p>}
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
          <Button onClick={handleAddTemplate}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Workflow Template
          </Button>
        }
      />

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
                    <Button variant="outline" size="sm" onClick={() => handleEditTemplate(template.id)}>
                      <Edit className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="w-3 h-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Request Type: <Badge variant="secondary">{template.requestType}</Badge> | Initial Step: <Badge variant="outline">{template.initialStepId}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="mb-2 text-base font-semibold text-foreground">Approval Steps:</h4>
                {template.steps.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {template.steps.map((step, index) => (
                       <AccordionItem value={step.id} key={step.id} className="mb-2 border rounded-md">
                        <AccordionTrigger className="px-4 py-3 hover:bg-accent/50 rounded-t-md">
                          <div className="flex items-center text-base font-medium">
                             <span className="mr-2 text-primary">{index + 1}.</span> {step.name}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pt-0 pb-3 border-t">
                          {renderStepDetails(step)}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                ) : (
                  <p className="text-sm text-muted-foreground">No steps defined for this workflow.</p>
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
