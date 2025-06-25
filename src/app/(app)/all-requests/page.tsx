// src/app/(app)/all-requests/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Truck, Recycle, ShieldCheck, ShoppingCart, Tags, Package, CalendarDays, User, MessageSquare, Bell, ChevronsUp, Send, Info, History, CheckCircle, CircleDot, Circle, Workflow as WorkflowIcon, Clock, Search, Filter as FilterIcon, ChevronsLeft, ChevronsRight, X, FileText, FileSpreadsheet, Printer, Hash } from "lucide-react";
import { type RequestType, MOCK_WORKFLOW_TEMPLATES } from "@/lib/constants";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/hooks/useAuth";
import { allRequestsSource, type ApprovalItem as GlobalApprovalItem } from '@/lib/mock-data';
import { calculateWorkflowProgress, getRequestTypeIcon, renderRequestPayloadDetailsDialog, renderWorkflowProgress } from '@/lib/request-helpers';
import { Progress } from "@/components/ui/progress";


const ITEMS_PER_PAGE = 10;


export default function AllRequestsPage() {
  const [requests, setRequests] = React.useState<GlobalApprovalItem[]>(allRequestsSource);
  const [selectedRequest, setSelectedRequest] = React.useState<GlobalApprovalItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterRequestType, setFilterRequestType] = React.useState("");
  const [filterRequester, setFilterRequester] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isFiltersApplied, setIsFiltersApplied] = React.useState(false);

  const distinctRequestTypes = React.useMemo(() => {
    const types = new Set(requests.map(req => req.requestType));
    return Array.from(types).sort();
  }, [requests]);

  const distinctStatuses = React.useMemo(() => {
    const statuses = new Set(requests.map(req => req.currentStepName));
    if (!statuses.has("Request Voided")) {
      statuses.add("Request Voided");
    }
    return Array.from(statuses).sort();
  }, [requests]);

  const filteredRequests = React.useMemo(() => {
    let tempRequests = [...requests];

    if (dateRange?.from) {
      tempRequests = tempRequests.filter(req => new Date(req.submissionDate) >= dateRange.from!);
    }
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      tempRequests = tempRequests.filter(req => new Date(req.submissionDate) <= toDate);
    }
    if (filterRequestType) {
      tempRequests = tempRequests.filter(req => req.requestType === filterRequestType);
    }
    if (filterRequester) {
      tempRequests = tempRequests.filter(req =>
        req.requesterName.toLowerCase().includes(filterRequester.toLowerCase())
      );
    }
    if (filterStatus) {
      if (filterStatus === "Voided") {
        tempRequests = tempRequests.filter(req => req.isVoided || req.currentStepName === "Request Voided");
      } else {
        tempRequests = tempRequests.filter(req => req.currentStepName === filterStatus);
      }
    }

    if (searchTerm) {
      tempRequests = tempRequests.filter(req =>
        req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requestType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requesterDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.currentStepName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        renderRequestSummary(req).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tempRequests.sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  }, [requests, searchTerm, dateRange, filterRequestType, filterRequester, filterStatus]);

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setDateRange(undefined);
    setFilterRequestType("");
    setFilterRequester("");
    setFilterStatus("");
    setIsFiltersApplied(false);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    setIsFiltersApplied(true);
    setCurrentPage(1);
  };

  const handleViewDetails = (item: GlobalApprovalItem) => {
    setSelectedRequest(item);
    setIsDetailDialogOpen(true);
  };

  const handleAddComment = () => {
    if (!selectedRequest || !newComment.trim() || !user) {
      toast({ title: "Cannot add empty comment or user not identified.", variant: "destructive" });
      return;
    }
    const updatedRequest = {
      ...selectedRequest,
      history: [
        ...selectedRequest.history,
        {
          stepId: selectedRequest.currentStepId,
          stepName: `Comment on: ${selectedRequest.currentStepName}`,
          actor: user.displayName || "Current User",
          action: "commented" as const,
          timestamp: new Date().toISOString(),
          comment: newComment,
        },
      ],
    };
    setSelectedRequest(updatedRequest);
    setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    setNewComment("");
    toast({ title: "Comment Added", description: `Comment added to request ${selectedRequest.id}.` });
  };

  const handleRemind = () => {
    if (!selectedRequest || !user) return;
     const updatedRequest = {
      ...selectedRequest,
      history: [
        ...selectedRequest.history,
        {
          stepId: selectedRequest.currentStepId,
          stepName: "Reminder Sent",
          actor: user.displayName || "Current User",
          action: "reminded" as const,
          timestamp: new Date().toISOString(),
          comment: `Reminder sent for step: ${selectedRequest.currentStepName}`,
        },
      ],
    };
    setSelectedRequest(updatedRequest);
    setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    toast({ title: "Reminder Sent (Mock)", description: `A reminder has been sent for request ${selectedRequest.id}.`});
  };

  const handleEscalate = () => {
    if (!selectedRequest || !user) return;
     const updatedRequest = {
      ...selectedRequest,
      history: [
        ...selectedRequest.history,
        {
          stepId: selectedRequest.currentStepId,
          stepName: "Request Escalated",
          actor: user.displayName || "Current User",
          action: "escalated" as const,
          timestamp: new Date().toISOString(),
          comment: `Request escalated at step: ${selectedRequest.currentStepName}`,
        },
      ],
    };
    setSelectedRequest(updatedRequest);
    setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    toast({ title: "Request Escalated (Mock)", description: `Request ${selectedRequest.id} has been escalated.`});
  };

  const getStatusBadgeVariant = (statusName: string, workflowTemplateId: string, currentStepId: string) => {
    const workflow = MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === workflowTemplateId);
    const isFinalStep = workflow?.steps.find(s => s.id === currentStepId && !s.nextStepId);

    if (statusName === "Request Voided") return "destructive";
    if (statusName === "Request Rejected") return "destructive";
    if (isFinalStep) return "default"; // Approved/Completed
    if (statusName.toLowerCase().includes("pending") || statusName.toLowerCase().includes("approval") || statusName.toLowerCase().includes("review")) return "secondary";
    return "outline";
  };

  const handleExport = (formatType: 'excel' | 'pdf') => {
    toast({
      title: `Exporting to ${formatType.toUpperCase()}...`,
      description: `Preparing all requests for ${formatType} export. This is a mock action.`,
    });
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="All Requests"
        description="View a consolidated list of all ongoing and completed requests across the system."
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <CardTitle>Request Overview</CardTitle>
              <CardDescription>
                This table shows all types of requests. Click an ID or 'View' for detailed information and actions.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" /> Export PDF
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <FilterIcon className="w-4 h-4 mr-2" /> Filters {isFiltersApplied && <span className="ml-2 h-2 w-2 rounded-full bg-primary animate-pulse"></span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4 space-y-4" align="end">
                  <div>
                    <label htmlFor="date-range" className="text-sm font-medium">Date Range</label>
                    <Calendar
                      id="date-range"
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      className="rounded-md border p-0 mt-1"
                      numberOfMonths={1}
                    />
                  </div>
                  <div>
                    <label htmlFor="filter-requester" className="text-sm font-medium">Requester Name/Email</label>
                    <Input
                      id="filter-requester"
                      placeholder="e.g., Ram Kumar"
                      value={filterRequester}
                      onChange={(e) => setFilterRequester(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                   <div>
                    <label htmlFor="filter-request-type" className="text-sm font-medium">Request Type</label>
                    <Select value={filterRequestType} onValueChange={setFilterRequestType}>
                      <SelectTrigger id="filter-request-type" className="mt-1">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        {distinctRequestTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <div>
                    <label htmlFor="filter-status" className="text-sm font-medium">Current Status/Step</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger id="filter-status" className="mt-1">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                         {distinctStatuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>Clear</Button>
                    <Button size="sm" onClick={handleApplyFilters}>Apply</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, Type, Requester, Status, Summary..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {paginatedRequests.length > 0 ? (
            <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Status / Current Step</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Button variant="link" size="sm" className="p-0 h-auto font-medium" onClick={() => handleViewDetails(item)}>
                          {item.id}
                        </Button>
                      </TableCell>
                      <TableCell className="flex items-center">
                        {getRequestTypeIcon(item.requestType)}
                        {item.requestType}
                      </TableCell>
                      <TableCell>{item.requesterName} ({item.requesterDepartment})</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(item.currentStepName, item.workflowTemplateId, item.currentStepId)} className="capitalize">
                          {item.currentStepName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(() => {
                            const progress = calculateWorkflowProgress(item);
                            return (
                                <div className="flex items-center gap-2 min-w-[150px]">
                                    <Progress value={progress} className="w-24" />
                                    <span className="text-xs font-medium text-muted-foreground">{`${Math.round(progress)}%`}</span>
                                </div>
                            );
                        })()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate" title={renderRequestSummary(item)}>
                        {renderRequestSummary(item)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableCaption>
                  Showing {paginatedRequests.length} of {filteredRequests.length} requests.
                  Page {currentPage} of {totalPages}.
                </TableCaption>
              </Table>
            </div>
             <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronsRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No requests match your current search/filters, or no requests available.
            </p>
          )}
        </CardContent>
      </Card>

      {selectedRequest && (
        <Dialog open={isDetailDialogOpen} onOpenChange={(isOpen) => {
          setIsDetailDialogOpen(isOpen);
          if (!isOpen) {
            setSelectedRequest(null);
            setNewComment("");
          }
        }}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <div className="flex justify-between items-center">
                <DialogTitle className="flex items-center">
                  {getRequestTypeIcon(selectedRequest.requestType, "w-6 h-6 mr-2 text-primary")}
                  Request Details: {selectedRequest.id}
                </DialogTitle>
                <div className="flex items-center gap-2">
                 <Badge variant="outline" className="capitalize">{selectedRequest.requestType}</Badge>
                  {selectedRequest.requestType === "Work Permit" &&
                    MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === selectedRequest.workflowTemplateId)?.steps.find(s => s.id === selectedRequest.currentStepId && !s.nextStepId) &&
                    (
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="w-4 h-4 mr-2" /> Print Permit
                      </Button>
                    )
                  }
                </div>
              </div>
              <DialogDescription>
                Detailed information, workflow progress, and approval timeline for request {selectedRequest.id}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100vh-20rem)] pr-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div className="md:col-span-2 space-y-4">
                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Info className="w-5 h-5 mr-2 text-primary"/>Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p><strong>Requester:</strong> {selectedRequest.requesterName} ({selectedRequest.requesterDepartment})</p>
                      <p><strong>Submitted:</strong> {new Date(selectedRequest.submissionDate).toLocaleString()}</p>
                      <p><strong>Current Step:</strong> {selectedRequest.currentStepName}</p>
                      {selectedRequest.isVoided && selectedRequest.voidReason && <p className="text-destructive"><strong>Void Reason:</strong> {selectedRequest.voidReason}</p>}
                      <div className="flex items-baseline pt-2">
                        <strong className="w-24 shrink-0">Progress:</strong>
                        <div className="flex items-center gap-2 w-full">
                          <Progress value={calculateWorkflowProgress(selectedRequest)} className="flex-grow" />
                          <span className="text-xs font-medium text-muted-foreground">{`${Math.round(calculateWorkflowProgress(selectedRequest))}%`}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Package className="w-5 h-5 mr-2 text-primary"/>Payload Details</CardTitle></CardHeader>
                    <CardContent>
                      {renderRequestPayloadDetailsDialog(selectedRequest.payload, selectedRequest.requestType)}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><History className="w-5 h-5 mr-2 text-primary"/>Approval Timeline</CardTitle></CardHeader>
                    <CardContent>
                      {selectedRequest.history.length > 0 ? (
                        <ul className="space-y-3">
                          {selectedRequest.history.map((entry, index) => (
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

                  {selectedRequest.currentStepName !== "Request Voided" && selectedRequest.currentStepName !== "Request Rejected" && !MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === selectedRequest.workflowTemplateId)?.steps.find(s => s.id === selectedRequest.currentStepId && !s.nextStepId) && (
                  <div className="space-y-3">
                      <h4 className="text-md font-semibold text-foreground">Actions & Comments</h4>
                      <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[80px]"
                      />
                      <Button onClick={handleAddComment} size="sm" disabled={!newComment.trim()}>
                          <MessageSquare className="w-4 h-4 mr-2" /> Add Comment
                      </Button>
                      <div className="flex gap-2 mt-2">
                          <Button onClick={handleRemind} variant="outline" size="sm">
                              <Bell className="w-4 h-4 mr-2" /> Remind Assignee
                          </Button>
                          <Button onClick={handleEscalate} variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive">
                              <ChevronsUp className="w-4 h-4 mr-2" /> Escalate
                          </Button>
                      </div>
                  </div>
                  )}
                </div>
                <div className="md:col-span-1">
                   <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><WorkflowIcon className="w-5 h-5 mr-2 text-primary"/>Workflow Progress</CardTitle></CardHeader>
                    <CardContent>
                        {renderWorkflowProgress(selectedRequest)}
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
