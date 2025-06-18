
// src/app/(app)/administration/work-permit-templates/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, Settings2, PlusCircle } from "lucide-react";

export default function WorkPermitTemplatesPage() {
  // Mock list of potential template sections for illustrative purposes
  const mockTemplateSections = [
    { id: "details", name: "Permit Details", description: "Requester, location, validity dates." },
    { id: "scope", name: "Scope of Work", description: "Detailed description of the task." },
    { id: "ppe", name: "Required PPE", description: "List of personal protective equipment." },
    { id: "safety_checks", name: "Safety Checklist", description: "Pre-activity safety verifications." },
    { id: "isolation", name: "Isolation Procedures", description: "Lock-out/Tag-out details." },
    { id: "authorized", name: "Authorized Personnel", description: "List of approved workers." },
    { id: "signatures", name: "Approval Signatures", description: "Sections for relevant approvals." },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Work Permit Template Configuration"
        description="Define and manage the structure and content of Work Permit documents."
        actions={
          <Button disabled> {/* Disabled as feature is not fully implemented */}
            <PlusCircle className="w-4 h-4 mr-2" /> Create New Template
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="w-5 h-5 mr-2 text-primary" />
            Template Customization (Under Development)
          </CardTitle>
          <CardDescription>
            This section will allow administrators to create and customize various Work Permit templates
            for different types of activities or locations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg bg-secondary/30 border border-dashed border-primary/50">
            <div className="flex items-center text-primary mb-3">
                <FileCheck className="w-8 h-8 mr-3"/>
                <h3 className="text-xl font-semibold">Future Functionality</h3>
            </div>
            <p className="text-muted-foreground mb-4">
              The ability to fully customize Work Permit templates is a planned feature. This will include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
              <li>Defining custom sections and fields.</li>
              <li>Adding mandatory safety checklists specific to activities.</li>
              <li>Specifying required attachments or pre-requisites.</li>
              <li>Managing different versions of templates.</li>
            </ul>
             <p className="text-sm text-foreground font-medium mb-2">Potential configurable sections could include:</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {mockTemplateSections.map(section => (
                    <div key={section.id} className="p-2 border rounded-md bg-background text-xs">
                        <p className="font-semibold text-foreground">{section.name}</p>
                        <p className="text-muted-foreground">{section.description}</p>
                    </div>
                ))}
             </div>
            <p className="mt-4 text-sm text-accent-foreground bg-accent/20 p-3 rounded-md">
              Currently, the system uses a standard, non-configurable Work Permit format.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
