// src/app/(app)/dashboard/page.tsx
"use client";
import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, MessageSquare, Briefcase, User, CalendarDays, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { APPROVAL_STATUSES, type ApprovalStatus } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ApprovalSchema, type ApprovalFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ApprovalItem {
  id: string;
  type: "Material Movement" | "Scrap Movement" | "Work Permit";
  requester: string;
  department: string;
  date: string;
  status: ApprovalStatus;
  details: Record<string, any>;
}

const mockApprovals: ApprovalItem[] = [
  { id: "MM001", type: "Material Movement", requester: "Alice Smith", department: "Production", date: "2024-07-28", status: "Pending Department Head", details: { material: "Steel Beams", quantity: 10, value: 150000 } },
  { id: "SM002", type: "Scrap Movement", requester: "Bob Johnson", department: "Maintenance", date: "2024-07-27", status: "Pending Finance", details: { scrapType: "E-waste", weight: "50kg" } },
  { id: "WP003", type: "Work Permit", requester: "Carol White", department: "IT", date: "2024-07-29", status: "Pending Safety", details: { building: "KOSMO", activity: "Server Maintenance" } },
  { id: "MM004", type: "Material Movement", requester: "David Brown", department: "Logistics", date: "2024-07-29", status: "Pending Dispatch", details: { material: "Spare Parts", quantity: 5, value: 20000 } },
];

export default function ApprovalsDashboardPage() {
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>(mockApprovals);
  const { toast } = useToast();

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(ApprovalSchema),
    defaultValues: { comment: "" },
  });

  const handleApprovalAction = (itemId: string, action: "approve" | "reject", comment?: string) => {
    console.log(`Item ${itemId} ${action}d with comment: ${comment}`);
    setApprovals(prev => prev.filter(item => item.id !== itemId)); // Remove from list for demo
    toast({
      title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
      description: `Request ID ${itemId} has been processed.`,
    });
    form.reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approvals Dashboard"
        description="Review and process pending requests assigned to you."
        actions={<Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter Requests</Button>}
      />

      {approvals.length === 0 && (
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <Check className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-foreground">All Caught Up!</h3>
            <p className="text-muted-foreground">There are no pending approvals for you at the moment.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {approvals.map((item) => (
          <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl font-headline">{item.type}</CardTitle>
                <Badge variant={item.status.startsWith("Pending") ? "secondary" : "default"} className="capitalize">
                  {item.status.toLowerCase()}
                </Badge>
              </div>
              <CardDescription>Request ID: {item.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="font-medium text-foreground">Requester:</span>&nbsp;{item.requester}
              </div>
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="font-medium text-foreground">Department:</span>&nbsp;{item.department}
              </div>
              <div className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="font-medium text-foreground">Date:</span>&nbsp;{item.date}
              </div>
              <div className="pt-2 border-t">
                <h4 className="font-semibold mb-1 text-foreground">Details:</h4>
                {Object.entries(item.details).map(([key, value]) => (
                  <p key={key} className="text-muted-foreground">
                    <span className="capitalize font-medium text-foreground">{key.replace(/([A-Z])/g, ' $1')}: </span>{value}
                  </p>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => handleApprovalAction(item.id, 'reject', data.comment))}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Request: {item.id}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Please provide a reason for rejecting this request. This comment will be visible to the requester.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <FormField
                        control={form.control}
                        name="comment"
                        render={({ field }) => (
                          <FormItem className="my-4">
                            <FormControl>
                              <Textarea placeholder="Enter reason for rejection (optional)..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => form.reset()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction type="submit" className="bg-destructive hover:bg-destructive/90">
                           Confirm Rejection
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </form>
                  </Form>
                </AlertDialogContent>
              </AlertDialog>

              <Button onClick={() => handleApprovalAction(item.id, "approve")} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Check className="w-4 h-4 mr-2" /> Approve
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
