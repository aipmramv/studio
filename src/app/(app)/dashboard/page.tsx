// src/app/(app)/dashboard/page.tsx
"use client";
import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, User, CalendarDays, Filter, LayoutGrid, List, Briefcase, Package, ShieldCheck, ShoppingCart, Tags, Recycle, Edit3, Truck, ChevronsUpDown, Eye, MessageSquare, Bell, ChevronsUp, Send, Info, History, Workflow as WorkflowIcon, Clock, Circle, CheckCircle, CircleDot, Loader2, Hash, FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { type RequestType, MOCK_WORKFLOW_TEMPLATES, type UserAction, type WorkflowStep } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ApprovalSchema, type ApprovalFormData } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  TableCaption
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as UIDialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { allRequestsSource, type ApprovalItem } from "@/lib/mock-data";
import { getRequestTypeIcon, renderRequestPayloadDetailsDialog, renderWorkflowProgress, renderRequestSummary } from '@/lib/request-helpers';
import Link from 'next/link';


export default function ApprovalsDashboardPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>(allRequestsSource);
  const [viewMode, setViewMode] = React.useState<'card' | 'grid'>('card');
  const { toast } = useToast();

  const [selectedRequestDetail, setSelectedRequestDetail] = React.useState<ApprovalItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");


  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(ApprovalSchema),
    defaultValues: { comment: "" },
  });

  const userVisibleApprovals = React.useMemo(() => {
    if (!user) return [];
    if(user.role === 'admin') return approvals.filter(item => item.currentAssignees.length > 0 && !item.isVoided);
    return approvals.filter(item =>
      !item.isVoided &&
      (item.currentAssignees.includes(user.role) ||
      (item.currentAssignees.includes('department_head') && user.department && item.requesterDepartment === user.department))
    );
  }, [approvals, user]);
  
  const myRecentSubmissions = React.useMemo(() => {
    if (!user) return [];
    return approvals
      .filter(item => item.requesterName === user.displayName)
      .sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime())
      .slice(0, 5);
  }, [approvals, user]);

  const handleViewDetails = (item: ApprovalItem) => {
    setSelectedRequestDetail(item);
    setIsDetailDialogOpen(true);
  };

  const handleApprovalAction = (itemId: string, action: UserAction, comment?: string) => {
    const item = approvals.find(ap => ap.id === itemId);
    if (!item || !user) return;

    const newHistoryEntry: any = {
        stepId: item.currentStepId,
        stepName: item.currentStepName,
        action: action,
        actor: user.displayName || "Current User",
        timestamp: new Date().toISOString(),
        comment: comment,
    };

    const currentWorkflow = MOCK_WORKFLOW_TEMPLATES.find(wf => wf.id === item.workflowTemplateId);
    const currentStepConfig = currentWorkflow?.steps.find(s => s.id === item.currentStepId);
    let nextStep: WorkflowStep | undefined;
    let updatedApprovals = [...approvals];
    let finalStatusStepName: string | null = null;

    if (action === 'approve') {
      if (currentStepConfig?.nextStepId) {
        nextStep = currentWorkflow?.steps.find(s => s.id === currentStepConfig.nextStepId);
      } else {
        // This is the final approval step
        finalStatusStepName = item.requestType === 'Work Permit' ? "Permit Issued" : "Request Approved & Closed";
      }
    } else if (action === 'reject') {
        if (currentStepConfig?.rejectionLeadsToStepId) {
          nextStep = currentWorkflow?.steps.find(s => s.id === currentStepConfig.rejectionLeadsToStepId);
        } else {
          // Rejection is final
          finalStatusStepName = "Request Rejected";
        }
    }


    if (nextStep) {
        // Move to the next step
        updatedApprovals = approvals.map(ap =>
            ap.id === itemId ? {
                ...ap,
                currentStepId: nextStep!.id,
                currentStepName: nextStep!.name,
                currentAssignees: nextStep!.assignedRoles,
                history: [...ap.history, newHistoryEntry, {
                    stepId: nextStep!.id,
                    stepName: `Pending ${nextStep!.name}`,
                    action: "system_auto_proceed",
                    actor: "System",
                    timestamp: new Date().toISOString()
                } as any]
            } : ap
        );
    } else if (finalStatusStepName) {
        // Reached a final state (approved, rejected, etc.)
        updatedApprovals = approvals.map(ap =>
            ap.id === itemId ? {
                ...ap,
                currentStepId: `request_${finalStatusStepName.toLowerCase().replace(/ /g, '_')}`,
                currentStepName: finalStatusStepName,
                currentAssignees: [], 
                history: [...ap.history, newHistoryEntry]
            } : ap
        );
    }

    setApprovals(updatedApprovals);

    toast({
      title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
      description: `Request ID ${itemId} has been processed.`,
    });
    form.reset();
  };

  const handleAddCommentForDetail = () => {
    if (!selectedRequestDetail || !newComment.trim() || !user) {
      toast({ title: "Cannot add empty comment or user not found", variant: "destructive" });
      return;
    }
    const updatedRequest = {
      ...selectedRequestDetail,
      history: [
        ...selectedRequestDetail.history,
        {
          stepId: selectedRequestDetail.currentStepId,
          stepName: `Comment on: ${selectedRequestDetail.currentStepName}`,
          actor: user.displayName || "Current User",
          action: "commented" as const,
          timestamp: new Date().toISOString(),
          comment: newComment,
        },
      ],
    };
    setSelectedRequestDetail(updatedRequest);
    setApprovals(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    setNewComment("");
    toast({ title: "Comment Added", description: `Comment added to request ${selectedRequestDetail.id}.` });
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
  
  const getListPageUrl = (requestType: RequestType) => {
    const map = {
      "Material Movement": "/material-movement/list",
      "Scrap Request": "/scrap-movement/list",
      "Work Permit": "/work-permit/list",
      "Purchase Order": "/purchase-order/list",
      "Sale Order": "/sale-order/list",
    };
    return map[requestType] || "/all-requests";
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Review pending approvals and track your recent submissions."
        actions={
          userVisibleApprovals.length > 0 ? (
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
          </div>
          ) : null
        }
      />
      
      {myRecentSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><FileSignature className="w-5 h-5 mr-2 text-primary" /> My Recent Submissions</CardTitle>
            <CardDescription>A quick look at the status of your most recently submitted requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRecentSubmissions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell className="flex items-center">{getRequestTypeIcon(item.requestType)}{item.requestType}</TableCell>
                      <TableCell><Badge variant="secondary">{item.currentStepName}</Badge></TableCell>
                      <TableCell>{new Date(item.submissionDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                         <Button variant="outline" size="sm" asChild>
                            <Link href={getListPageUrl(item.requestType)}><Eye className="w-4 h-4 mr-2"/>View in List</Link>
                         </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {userVisibleApprovals.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Check className="w-16 h-16 mx-auto text-primary mb-4" />
            <h3 className="text-xl font-semibold text-foreground">All Caught Up!</h3>
            <p className="text-muted-foreground">There are no pending approvals for you at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Pending My Approval ({userVisibleApprovals.length})</h2>
          {viewMode === 'card' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userVisibleApprovals.map((item) => (
                <Card key={item.id} className="transition-shadow duration-300 flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                       <div className="flex items-center">
                        {getRequestTypeIcon(item.requestType, "w-5 h-5 mr-2 text-primary")}
                        <CardTitle className="text-xl font-headline">{item.requestType}</CardTitle>
                       </div>
                      <Badge variant="secondary" className="capitalize">
                        {item.currentStepName.toLowerCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                        Request ID: <Button variant="link" size="sm" className="p-0 h-auto text-xs text-primary" onClick={() => handleViewDetails(item)}>{item.id}</Button>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm flex-grow">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium text-foreground">Requester:</span>&nbsp;{item.requesterName} ({item.requesterDepartment})
                    </div>
                    <div className="flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span className="font-medium text-foreground">Submitted:</span>&nbsp;{new Date(item.submissionDate).toLocaleDateString()}
                    </div>
                    <div className="pt-2 mt-2 border-t">
                      <h4 className="font-semibold mb-1 text-foreground">Summary:</h4>
                      <p className="text-muted-foreground text-xs">{renderRequestSummary(item)}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 mt-auto pt-4 border-t">
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
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Current Step</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userVisibleApprovals.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                            <Button variant="link" size="sm" className="p-0 h-auto font-medium" onClick={() => handleViewDetails(item)}>
                                {item.id}
                            </Button>
                        </TableCell>
                        <TableCell className="flex items-center"> {getRequestTypeIcon(item.requestType)} {item.requestType}</TableCell>
                        <TableCell>{item.requesterName} ({item.requesterDepartment})</TableCell>
                        <TableCell>{new Date(item.submissionDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {item.currentStepName.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={renderRequestSummary(item)}>
                            {renderRequestSummary(item)}
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

    {selectedRequestDetail && (
        <Dialog open={isDetailDialogOpen} onOpenChange={(isOpen) => {
          setIsDetailDialogOpen(isOpen);
          if (!isOpen) {
            setSelectedRequestDetail(null);
            setNewComment("");
          }
        }}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {getRequestTypeIcon(selectedRequestDetail.requestType, "w-6 h-6 mr-2 text-primary")}
                Request Details: {selectedRequestDetail.id}
                <Badge variant="outline" className="ml-auto capitalize">{selectedRequestDetail.requestType}</Badge>
              </DialogTitle>
              <DialogDescription>
                Detailed information, workflow progress, and approval timeline for request {selectedRequestDetail.id}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100vh-20rem)] pr-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Info className="w-5 h-5 mr-2 text-primary"/>Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p><strong>Requester:</strong> {selectedRequestDetail.requesterName} ({selectedRequestDetail.requesterDepartment})</p>
                      <p><strong>Submitted:</strong> {new Date(selectedRequestDetail.submissionDate).toLocaleString()}</p>
                      <p><strong>Current Step:</strong> {selectedRequestDetail.currentStepName}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Package className="w-5 h-5 mr-2 text-primary"/>Payload Details</CardTitle></CardHeader>
                    <CardContent>
                      {renderRequestPayloadDetailsDialog(selectedRequestDetail.payload, selectedRequestDetail.requestType)}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><History className="w-5 h-5 mr-2 text-primary"/>Approval Timeline</CardTitle></CardHeader>
                    <CardContent>
                      {selectedRequestDetail.history.length > 0 ? (
                        <ul className="space-y-3">
                          {selectedRequestDetail.history.map((entry, index) => (
                            <li key={index} className="p-3 rounded-md border bg-background text-sm">
                              <p className="font-semibold">{entry.stepName} - <span className="capitalize font-normal">{entry.action.replace(/_/g, " ")}</span></p>
                              <p className="text-xs text-muted-foreground">By: {entry.actor} on {new Date(entry.timestamp).toLocaleString()}</p>
                              {entry.comment && <p className="mt-1 italic text-muted-foreground">"{entry.comment}"</p>}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No history available yet.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Separator />

                  <div className="space-y-3">
                      <h4 className="text-md font-semibold text-foreground">Actions & Comments</h4>
                      <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[80px]"
                      />
                      <Button onClick={handleAddCommentForDetail} size="sm" disabled={!newComment.trim()}>
                          <MessageSquare className="w-4 h-4 mr-2" /> Add Comment
                      </Button>
                      <div className="flex gap-2 mt-2">
                          <Button variant="outline" size="sm" onClick={() => toast({title: "Reminder Sent (Mock)"})}>
                              <Bell className="w-4 h-4 mr-2" /> Remind Assignee
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => toast({title: "Request Escalated (Mock)"})}>
                              <ChevronsUp className="w-4 h-4 mr-2" /> Escalate
                          </Button>
                      </div>
                  </div>
                </div>
                <div className="md:col-span-1">
                   <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><WorkflowIcon className="w-5 h-5 mr-2 text-primary"/>Workflow Progress</CardTitle></CardHeader>
                    <CardContent>
                        {renderWorkflowProgress(selectedRequestDetail)}
                    </CardContent>
                   </Card>
                </div>
              </div>
            </ScrollArea>
            <UIDialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </UIDialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
