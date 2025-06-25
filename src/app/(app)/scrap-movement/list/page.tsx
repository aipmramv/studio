// src/app/(app)/scrap-movement/list/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as UIDialogFooter,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Eye, Edit, Trash2, PlusCircle, Filter as FilterIcon, CalendarDays, Search, Recycle, ChevronsLeft, ChevronsRight, AlertCircle, Package, Info, History, Workflow as WorkflowIcon, MessageSquare, Save, Ban, Hash } from "lucide-react";
import { type RequestType, type UserRole, type UserAction, MOCK_WORKFLOW_TEMPLATES, type WorkflowStep, DEPARTMENTS, REQUEST_STATUSES, type RequestStatus, SCRAP_TYPES } from "@/lib/constants";
import { type ScrapMovementFormData } from "@/lib/schemas";
import { ScrapMovementForm } from "@/components/forms/ScrapMovementForm";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/hooks/useAuth";
import { allRequestsSource, renderRequestPayloadDetailsDialog, renderWorkflowProgress, getRequestTypeIcon, type ApprovalItem as GlobalApprovalItem } from '@/lib/mock-data';

const ITEMS_PER_PAGE = 10;

interface ScrapRequestDisplayItem extends GlobalApprovalItem {
  payload: ScrapMovementFormData;
}

export default function ScrapMovementListPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [scrapRequests, setScrapRequests] = React.useState<ScrapRequestDisplayItem[]>(
    allRequestsSource.filter(req => req.requestType === "Scrap Request") as ScrapRequestDisplayItem[]
  );

  const [selectedRequestDetail, setSelectedRequestDetail] = React.useState<ScrapRequestDisplayItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [editingRequest, setEditingRequest] = React.useState<ScrapRequestDisplayItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [requestToVoid, setRequestToVoid] = React.useState<ScrapRequestDisplayItem | null>(null);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = React.useState(false);
  const [voidReason, setVoidReason] = React.useState("");
  const [newComment, setNewComment] = React.useState("");

  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterStatus, setFilterStatus] = React.useState<RequestStatus | "">("");
  const [filterScrapType, setFilterScrapType] = React.useState<typeof SCRAP_TYPES[number] | "">("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isFiltersApplied, setIsFiltersApplied] = React.useState(false);

  const filteredScrapRequests = React.useMemo(() => {
    let tempItems = scrapRequests.filter(item => user?.role === 'admin' || item.requesterName === user?.displayName || MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === item.workflowTemplateId)?.steps.find(s => s.id === item.currentStepId)?.assignedRoles.includes(user?.role as UserRole) );

    if (dateRange?.from) {
      tempItems = tempItems.filter(item => new Date(item.submissionDate) >= dateRange.from!);
    }
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      tempItems = tempItems.filter(item => new Date(item.submissionDate) <= toDate);
    }
     if (filterScrapType) {
      tempItems = tempItems.filter(item => item.payload.scrapType === filterScrapType);
    }
    if (filterStatus) {
       if (filterStatus === "Voided") {
         tempItems = tempItems.filter(item => item.currentStepName === "Request Voided");
      } else {
         tempItems = tempItems.filter(item => item.currentStepName.toLowerCase().includes(filterStatus.toLowerCase()) || ( MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === item.workflowTemplateId)?.steps.find(s => s.id === item.currentStepId && !s.nextStepId) && filterStatus === "Completed" && item.currentStepName !== "Request Voided" && item.currentStepName !== "Request Rejected" ));
      }
    }
    if (searchTerm) {
      tempItems = tempItems.filter(item =>
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payload.scrapType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.payload.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.payload.gatePassNumber && item.payload.gatePassNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.currentStepName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tempItems.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  }, [scrapRequests, searchTerm, dateRange, filterStatus, filterScrapType, user]);

  const totalPages = Math.ceil(filteredScrapRequests.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredScrapRequests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewDetails = (item: ScrapRequestDisplayItem) => {
    setSelectedRequestDetail(item);
    setIsDetailDialogOpen(true);
  };

  const handleEditRequest = (item: ScrapRequestDisplayItem) => {
    setEditingRequest(item);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = (updatedData: ScrapMovementFormData) => {
    if (!editingRequest) return;
    const updatedItem: ScrapRequestDisplayItem = { ...editingRequest, payload: updatedData };

    const globalIndex = allRequestsSource.findIndex(req => req.id === editingRequest.id);
    if (globalIndex !== -1) {
      allRequestsSource[globalIndex] = updatedItem as GlobalApprovalItem;
    }
    setScrapRequests(prev => prev.map(item => item.id === editingRequest.id ? updatedItem : item));
    toast({ title: "Request Updated", description: `Request ID ${editingRequest.id} has been updated.` });
    setIsEditDialogOpen(false);
    setEditingRequest(null);
  };

  const handleOpenVoidDialog = (item: ScrapRequestDisplayItem) => {
    setRequestToVoid(item);
    setIsVoidDialogOpen(true);
  };

  const handleConfirmVoid = () => {
    if (!requestToVoid || !user) return;
     const voidedItem: ScrapRequestDisplayItem = {
      ...requestToVoid,
      isVoided: true,
      voidReason: voidReason || "No reason provided.",
      currentStepId: "request_voided_final",
      currentStepName: "Request Voided",
      currentAssignees: [],
      history: [
        ...requestToVoid.history,
        {
          stepId: requestToVoid.currentStepId,
          stepName: "Request Voided",
          action: "system_auto_proceed",
          actor: user.displayName || "System",
          timestamp: new Date().toISOString(),
          comment: `Voided: ${voidReason || "No reason provided."}`,
        },
      ],
    };
    const globalIndex = allRequestsSource.findIndex(req => req.id === requestToVoid.id);
    if (globalIndex !== -1) {
      allRequestsSource[globalIndex] = voidedItem as GlobalApprovalItem;
    }
    setScrapRequests(prevItems => prevItems.map(item => item.id === requestToVoid.id ? voidedItem : item));
    toast({ title: "Request Voided", description: `Request ${requestToVoid.id} has been voided.` });
    setIsVoidDialogOpen(false);
    setVoidReason("");
    setRequestToVoid(null);
  };
  
  const handleAddCommentForDetail = () => {
    if (!selectedRequestDetail || !newComment.trim() || !user) return;
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
    setScrapRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    const globalIndex = allRequestsSource.findIndex(req => req.id === updatedRequest.id);
    if (globalIndex !== -1) {
      allRequestsSource[globalIndex] = updatedRequest as GlobalApprovalItem;
    }
    setNewComment("");
    toast({ title: "Comment Added", description: `Comment added to request ${selectedRequestDetail.id}.` });
  };

  const getStatusBadgeVariantForScrap = (statusName: string, workflowTemplateId: string, currentStepId: string) => {
    const workflow = MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === workflowTemplateId);
    const isFinalStep = workflow?.steps.find(s => s.id === currentStepId && !s.nextStepId);
    if (statusName === "Request Voided" || statusName === "Request Rejected") return "destructive";
    if (isFinalStep) return "default";
    if (statusName.toLowerCase().includes("pending") || statusName.toLowerCase().includes("approval")) return "secondary";
    return "outline";
  };
  
  const isRequestEditable = (item: ScrapRequestDisplayItem) => {
     if (item.isVoided || item.currentStepName === "Request Voided" || item.currentStepName === "Request Rejected") return false;
    const workflow = MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === item.workflowTemplateId);
    const isFinalStep = workflow?.steps.find(s => s.id === item.currentStepId && !s.nextStepId);
    return !isFinalStep;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Scrap Disposal Requests"
        description="Manage and track all Scrap Disposal requests."
        actions={
          <Button asChild>
            <Link href="/scrap-movement/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Request
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center"><Recycle className="w-5 h-5 mr-2 text-primary"/>Scrap Request List</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <FilterIcon className="w-4 h-4 mr-2" /> Filters {isFiltersApplied && <span className="ml-2 h-2 w-2 rounded-full bg-primary animate-pulse"></span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="end">
                <div>
                  <label htmlFor="date-range-scrap" className="text-sm font-medium">Submission Date Range</label>
                  <Calendar
                    id="date-range-scrap"
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    className="rounded-md border p-0 mt-1"
                    numberOfMonths={1}
                  />
                </div>
                 <div>
                  <label htmlFor="filter-scrap-type" className="text-sm font-medium">Scrap Type</label>
                  <Select value={filterScrapType} onValueChange={(val) => setFilterScrapType(val as typeof SCRAP_TYPES[number] | "")}>
                    <SelectTrigger id="filter-scrap-type" className="mt-1"><SelectValue placeholder="All Scrap Types" /></SelectTrigger>
                    <SelectContent>{SCRAP_TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="filter-status-scrap" className="text-sm font-medium">Status</label>
                  <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as RequestStatus)}>
                    <SelectTrigger id="filter-status-scrap" className="mt-1"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                    <SelectContent>{REQUEST_STATUSES.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => { setDateRange(undefined); setFilterStatus(""); setFilterScrapType(""); setIsFiltersApplied(false); setCurrentPage(1); }}>Clear</Button>
                  <Button size="sm" onClick={() => { setIsFiltersApplied(true); setCurrentPage(1); }}>Apply</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <CardDescription>View, track, and manage all your Scrap Disposal requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, Type, Description, Requester, Status..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {paginatedItems.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request ID</TableHead>
                      <TableHead>Scrap Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Button variant="link" size="sm" className="p-0 h-auto font-medium" onClick={() => handleViewDetails(item)}>
                            {item.id}
                          </Button>
                        </TableCell>
                        <TableCell>{item.payload.scrapType}</TableCell>
                        <TableCell className="max-w-xs truncate" title={item.payload.description}>{item.payload.description}</TableCell>
                        <TableCell className="text-right">{item.payload.quantity}</TableCell>
                        <TableCell className="text-right">{item.payload.weight}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariantForScrap(item.currentStepName, item.workflowTemplateId, item.currentStepId)} className="capitalize">
                            {item.currentStepName}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.requesterName}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" title="View Details" onClick={() => handleViewDetails(item)}><Eye className="w-4 h-4 text-primary" /></Button>
                          <Button variant="outline" size="icon" title="Edit Request" disabled={!isRequestEditable(item)} onClick={() => handleEditRequest(item)} className="text-primary border-primary hover:bg-primary/10 disabled:text-muted-foreground disabled:border-muted-foreground/50">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Void Request" disabled={!isRequestEditable(item)} onClick={() => handleOpenVoidDialog(item)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>
                    Showing {paginatedItems.length} of {filteredScrapRequests.length} Scrap Disposal requests.
                    Page {currentPage} of {totalPages}.
                  </TableCaption>
                </Table>
              </div>
              <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                  <ChevronsLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                  Next <ChevronsRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No Scrap Disposal requests match your current search/filters.
            </p>
          )}
        </CardContent>
      </Card>

       {selectedRequestDetail && (
        <Dialog open={isDetailDialogOpen} onOpenChange={(isOpen) => {
          setIsDetailDialogOpen(isOpen);
          if (!isOpen) { setSelectedRequestDetail(null); setNewComment(""); }
        }}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                {getRequestTypeIcon(selectedRequestDetail.requestType, "w-6 h-6 mr-2 text-primary")}
                Scrap Request Details: {selectedRequestDetail.id}
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
                       {(selectedRequestDetail.payload as ScrapMovementFormData).gatePassNumber && <p><strong>Gate Pass No.:</strong> <span className='flex items-center'><Hash className='w-3 h-3 mr-1'/>{(selectedRequestDetail.payload as ScrapMovementFormData).gatePassNumber}</span></p>}
                      {selectedRequestDetail.isVoided && selectedRequestDetail.voidReason && <p className="text-destructive"><strong>Void Reason:</strong> {selectedRequestDetail.voidReason}</p>}
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
                      ) : (<p className="text-sm text-muted-foreground">No history available yet.</p>)}
                    </CardContent>
                  </Card>
                   <Separator />
                   <div className="space-y-3">
                      <h4 className="text-md font-semibold text-foreground">Actions & Comments</h4>
                      <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="min-h-[80px]"/>
                      <Button onClick={handleAddCommentForDetail} size="sm" disabled={!newComment.trim()}><MessageSquare className="w-4 h-4 mr-2" /> Add Comment</Button>
                  </div>
                </div>
                <div className="md:col-span-1">
                   <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><WorkflowIcon className="w-5 h-5 mr-2 text-primary"/>Workflow Progress</CardTitle></CardHeader>
                    <CardContent>{renderWorkflowProgress(selectedRequestDetail)}</CardContent>
                   </Card>
                </div>
              </div>
            </ScrollArea>
            <UIDialogFooter><DialogClose asChild><Button variant="outline">Close</Button></DialogClose></UIDialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {editingRequest && isEditDialogOpen && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) { setEditingRequest(null); setIsEditDialogOpen(false); } }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center"><Edit className="w-5 h-5 mr-2 text-primary" /> Edit Scrap Request: {editingRequest.id}</DialogTitle>
              <DialogDescription>Modify the details of this scrap disposal request.</DialogDescription>
            </DialogHeader>
            <ScrapMovementForm
              initialData={editingRequest.payload}
              isEditing={true}
              onSave={handleSaveEdit}
              onCancel={() => { setIsEditDialogOpen(false); setEditingRequest(null); }}
            />
          </DialogContent>
        </Dialog>
      )}

      {requestToVoid && (
        <AlertDialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-destructive"/>Confirm Void Request</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to void Scrap Request <strong>{requestToVoid.id}</strong>? This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 my-4">
              <label htmlFor="voidReasonScrap" className="text-sm font-medium">Reason for Voiding (Optional)</label>
              <Textarea id="voidReasonScrap" placeholder="Enter reason..." value={voidReason} onChange={(e) => setVoidReason(e.target.value)}/>
            </div>
            <AlertDialogFooter><AlertDialogCancel onClick={() => { setIsVoidDialogOpen(false); setVoidReason(""); }}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleConfirmVoid} className="bg-destructive hover:bg-destructive/90">Confirm Void</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
