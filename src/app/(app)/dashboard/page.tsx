
// src/app/(app)/dashboard/page.tsx
"use client";
import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, MessageSquare, Briefcase, User, CalendarDays, Filter, LayoutGrid, List } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { APPROVAL_STATUSES, type ApprovalStatus, type Currency, CURRENCY_SYMBOLS } from "@/lib/constants";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ApprovalItemDetails {
  material?: string;
  quantity?: number;
  value?: number;
  currency?: Currency;
  scrapType?: string;
  weight?: string;
  building?: string;
  activity?: string;
  [key: string]: any; // For other potential details
}

interface ApprovalItem {
  id: string;
  type: "Material Movement" | "Scrap Movement" | "Work Permit";
  requester: string;
  department: string;
  date: string;
  status: ApprovalStatus;
  details: ApprovalItemDetails;
}

const mockApprovals: ApprovalItem[] = [
  { id: "MM001", type: "Material Movement", requester: "Alice Smith", department: "Production", date: "2024-07-28", status: "Pending Department Head", details: { material: "Steel Beams", quantity: 10, value: 150000, currency: "INR" } },
  { id: "SM002", type: "Scrap Movement", requester: "Bob Johnson", department: "Maintenance", date: "2024-07-27", status: "Pending Finance", details: { scrapType: "E-waste", weight: "50kg" } },
  { id: "WP003", type: "Work Permit", requester: "Carol White", department: "IT", date: "2024-07-29", status: "Pending Safety", details: { building: "KOSMO", activity: "Server Maintenance" } },
  { id: "MM004", type: "Material Movement", requester: "David Brown", department: "Logistics", date: "2024-07-29", status: "Pending Dispatch", details: { material: "Spare Parts", quantity: 5, value: 200, currency: "EUR" } },
];

export default function ApprovalsDashboardPage() {
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>(mockApprovals);
  const [viewMode, setViewMode] = React.useState<'card' | 'grid'>('card');
  const { toast } = useToast();

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(ApprovalSchema),
    defaultValues: { comment: "" },
  });

  const handleApprovalAction = (itemId: string, action: "approve" | "reject", comment?: string) => {
    console.log(`Item ${itemId} ${action}d with comment: ${comment}`);
    setApprovals(prev => prev.filter(item => item.id !== itemId)); 
    toast({
      title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
      description: `Request ID ${itemId} has been processed.`,
    });
    form.reset();
  };

  const renderRejectDialogContent = (item: ApprovalItem) => (
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
  );

  const renderApprovalDetails = (details: ApprovalItemDetails) => {
    return Object.entries(details).map(([key, value]) => {
      if (key === 'currency' && details.value !== undefined) return null; // Currency is handled with value
      let displayValue = String(value);
      if (key === 'value' && details.currency && value !== undefined) {
        displayValue = `${CURRENCY_SYMBOLS[details.currency as Currency]}${Number(value).toLocaleString()}`;
      }
      return (
        <p key={key} className="text-muted-foreground">
          <span className="capitalize font-medium text-foreground">{key.replace(/([A-Z])/g, ' $1')}: </span>{displayValue}
        </p>
      );
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Approvals Dashboard"
        description="Review and process pending requests assigned to you."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'card' ? 'default' : 'outline'}
              onClick={() => setViewMode('card')}
              size="sm"
            >
              <List className="w-4 h-4 mr-2" />
              Card View
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              onClick={() => setViewMode('grid')}
              size="sm"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Grid View
            </Button>
            <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />Filter Requests</Button>
          </div>
        }
      />

      {approvals.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <Check className="w-16 h-16 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold text-foreground">All Caught Up!</h3>
            <p className="text-muted-foreground">There are no pending approvals for you at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'card' && (
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
                      {renderApprovalDetails(item.details)}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <X className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </AlertDialogTrigger>
                      {renderRejectDialogContent(item)}
                    </AlertDialog>
                    <Button onClick={() => handleApprovalAction(item.id, "approve")} className="w-full">
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {viewMode === 'grid' && (
            <Card className="shadow-lg">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      {/* Optionally add a details column or expand row for details in grid view */}
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvals.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.type}</TableCell>
                        <TableCell>{item.requester}</TableCell>
                        <TableCell>{item.department}</TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          <Badge variant={item.status.startsWith("Pending") ? "secondary" : "default"} className="capitalize">
                            {item.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex gap-2 justify-end">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive">
                                  <X className="w-3 h-3 mr-1" /> Reject
                                </Button>
                              </AlertDialogTrigger>
                              {renderRejectDialogContent(item)}
                            </AlertDialog>
                            <Button onClick={() => handleApprovalAction(item.id, "approve")} size="sm">
                              <Check className="w-3 h-3 mr-1" /> Approve
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
