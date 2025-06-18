
// src/app/(app)/administration/email-templates/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Mail, Save, PlusCircle, Info } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EmailTemplateSchema, type EmailTemplateFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as UiFormDescription } from "@/components/ui/form";

interface EmailTemplate extends EmailTemplateFormData {}

const mockEmailTemplates: EmailTemplate[] = [
  { id: "et_new_request", name: "New Request Submitted", subject: "New Request {{requestId}} Submitted", body: "Dear Team,\n\nA new request ({{requestType}}) with ID {{requestId}} has been submitted by {{requesterName}} and requires your attention.\n\nDetails: {{requestLink}}\n\nThank you.", triggerEvent: "request_submitted" },
  { id: "et_request_approved", name: "Request Approved", subject: "Request {{requestId}} Approved", body: "Dear {{userName}},\n\nYour request ({{requestType}}) with ID {{requestId}} has been approved at step {{stepName}}.\n\nComments: {{comment}}\n\nThank you.", triggerEvent: "step_approved" },
  { id: "et_request_rejected", name: "Request Rejected", subject: "Action Required: Request {{requestId}} Rejected", body: "Dear {{userName}},\n\nYour request ({{requestType}}) with ID {{requestId}} has been rejected at step {{stepName}}.\n\nReason: {{comment}}\nPlease review and take necessary action: {{requestLink}}\n\nThank you.", triggerEvent: "step_rejected" },
];


export default function EmailTemplatesPage() {
  const [templates, setTemplates] = React.useState<EmailTemplate[]>(mockEmailTemplates);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<EmailTemplate | null>(null);
  const { toast } = useToast();

  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(EmailTemplateSchema),
    defaultValues: { id: "", name: "", subject: "", body: "", triggerEvent: "" },
  });

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    form.reset(template);
    setIsDialogOpen(true);
  };
  
  const openAddDialog = () => {
    setEditingTemplate(null);
    form.reset({ id: `et_${Date.now()}`, name: "", subject: "", body: "", triggerEvent: ""});
    setIsDialogOpen(true);
  };

  const handleFormSubmit = (data: EmailTemplateFormData) => {
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...data } : t));
      toast({ title: "Email Template Updated", description: `Template "${data.name}" has been updated.` });
    } else {
       setTemplates(prev => [...prev, data]);
       toast({ title: "Email Template Added", description: `Template "${data.name}" has been added.` });
    }
    setIsDialogOpen(false);
    setEditingTemplate(null);
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Email Templates Configuration"
        description="Manage and customize email templates for system notifications."
        actions={
           <Button onClick={openAddDialog}>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Template
          </Button>
        }
      />

      <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
        setIsDialogOpen(isOpen);
        if (!isOpen) {
          form.reset();
          setEditingTemplate(null);
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit" : "Add"} Email Template: {editingTemplate?.name}</DialogTitle>
            <DialogDescription>
              Modify the content of this email template. Use placeholders like {'{{variableName}}'}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
              <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Request Approved Notification" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Request {{requestId}} Status Update" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Body</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter email content here..." {...field} rows={10} className="min-h-[200px]" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                  )}
              />
               <FormField
                control={form.control}
                name="triggerEvent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <Info className="w-4 h-4 mr-1 text-muted-foreground" />
                      Trigger Event / Workflow Step ID (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., request_submitted or step_finance_approval" {...field} />
                    </FormControl>
                    <UiFormDescription>
                      For advanced rules: Link this template to a specific workflow event or step ID.
                    </UiFormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (<Input type="hidden" {...field} />)}
              />
              <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button type="submit"><Save className="w-4 h-4 mr-2" /> {editingTemplate ? "Save Changes" : "Add Template"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Mail className="w-5 h-5 mr-2 text-primary" /> Email Template List</CardTitle>
          <CardDescription>View and edit system email templates. Trigger events define when specific templates are used.</CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Trigger Event/Step</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.subject}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{template.triggerEvent || "General"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(template)}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{templates.length} email template(s) found.</TableCaption>
            </Table>
          ) : (
             <p className="text-center text-muted-foreground py-4">No email templates found. <Button variant="link" onClick={openAddDialog} className="p-0">Add one now</Button>.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
