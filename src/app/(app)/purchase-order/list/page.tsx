
// src/app/(app)/purchase-order/list/page.tsx
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
import { Eye, Edit, Trash2, PlusCircle, Filter as FilterIcon, CalendarDays, Search, ShoppingCart, ChevronsLeft, ChevronsRight, AlertCircle, Package, Info, History, Workflow as WorkflowIcon, Clock, Circle, CheckCircle, Hash, MessageSquare, Bell, ChevronsUp, Send, Printer } from "lucide-react";
import { type RequestType, type UserRole, type UserAction, MOCK_WORKFLOW_TEMPLATES, type WorkflowStep, DEPARTMENTS, REQUEST_STATUSES, type RequestStatus } from "@/lib/constants";
import { type MaterialMovementFormData, type ScrapMovementFormData, type WorkPermitFormData, type PurchaseOrderFormData, type SaleOrderFormData, type OrderItem } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/hooks/useAuth";
import { mockAllRequestsData as allRequestsSource, renderRequestPayloadDetailsDialog, renderWorkflowProgress, getRequestTypeIcon, ApprovalItem as GlobalApprovalItem } from "@/app/(app)/all-requests/page"; // Import shared data and functions

const ITEMS_PER_PAGE = 10;

// Type specific to this page, derived from GlobalApprovalItem
interface PurchaseOrderDisplayItem extends GlobalApprovalItem {
  payload: PurchaseOrderFormData; // Ensure payload is typed correctly
}

export default function PurchaseOrderListPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State for all POs, potentially including those from other sources or modified
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrderDisplayItem[]>(
    allRequestsSource.filter(req => req.requestType === "Purchase Order") as PurchaseOrderDisplayItem[]
  );

  // Dialog states
  const [selectedRequestDetail, setSelectedRequestDetail] = React.useState<PurchaseOrderDisplayItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = React.useState(false);
  const [requestToVoid, setRequestToVoid] = React.useState<PurchaseOrderDisplayItem | null>(null);
  const [voidReason, setVoidReason] = React.useState("");
  const [newComment, setNewComment] = React.useState("");


  // Filter states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [filterStatus, setFilterStatus] = React.useState<RequestStatus | "">("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isFiltersApplied, setIsFiltersApplied] = React.useState(false);

  const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const filteredPurchaseOrders = React.useMemo(() => {
    let tempPOs = purchaseOrders.filter(po => user?.role === 'admin' || po.requesterName === user?.displayName || MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === po.workflowTemplateId)?.steps.find(s => s.id === po.currentStepId)?.assignedRoles.includes(user?.role as UserRole) );


    if (dateRange?.from) {
      tempPOs = tempPOs.filter(po => new Date(po.submissionDate) >= dateRange.from!);
    }
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      tempPOs = tempPOs.filter(po => new Date(po.submissionDate) <= toDate);
    }
    if (filterStatus) {
      // For "Voided", check our custom flag or specific step name
      if (filterStatus === "Voided") {
         tempPOs = tempPOs.filter(po => po.currentStepName === "Request Voided");
      } else {
         tempPOs = tempPOs.filter(po => po.currentStepName.toLowerCase().includes(filterStatus.toLowerCase()) || ( MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === po.workflowTemplateId)?.steps.find(s => s.id === po.currentStepId && !s.nextStepId) && filterStatus === "Completed" && po.currentStepName !== "Request Voided" && po.currentStepName !== "Request Rejected" ));
      }
    }
    if (searchTerm) {
      tempPOs = tempPOs.filter(po =>
        po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.payload as PurchaseOrderFormData).vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.currentStepName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return tempPOs.sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());
  }, [purchaseOrders, searchTerm, dateRange, filterStatus, user]);

  const totalPages = Math.ceil(filteredPurchaseOrders.length / ITEMS_PER_PAGE);
  const paginatedPOs = filteredPurchaseOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewDetails = (item: PurchaseOrderDisplayItem) => {
    setSelectedRequestDetail(item);
    setIsDetailDialogOpen(true);
  };

  const handleOpenVoidDialog = (item: PurchaseOrderDisplayItem) => {
    setRequestToVoid(item);
    setIsVoidDialogOpen(true);
  };

  const handleConfirmVoid = () => {
    if (!requestToVoid || !user) return;
    // Update the local state. In a real app, this would be an API call.
    setPurchaseOrders(prevPOs => prevPOs.map(po =>
      po.id === requestToVoid.id
        ? {
            ...po,
            currentStepId: "request_voided_final", // Special status
            currentStepName: "Request Voided",
            currentAssignees: [],
            history: [
              ...po.history,
              {
                stepId: po.currentStepId,
                stepName: "Request Voided",
                action: "system_auto_proceed", // Or a custom "voided" action type
                actor: user.displayName || "System",
                timestamp: new Date().toISOString(),
                comment: `Voided: ${voidReason || "No reason provided."}`,
              },
            ],
          }
        : po
    ));
    toast({ title: "Purchase Order Voided", description: `PO ${requestToVoid.id} has been voided.` });
    setIsVoidDialogOpen(false);
    setVoidReason("");
    setRequestToVoid(null);
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
    // Also update the main list
    setPurchaseOrders(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    setNewComment("");
    toast({ title: "Comment Added", description: `Comment added to request ${selectedRequestDetail.id}.` });
  };


  const getStatusBadgeVariantForPO = (statusName: string, workflowTemplateId: string, currentStepId: string) => {
    const workflow = MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === workflowTemplateId);
    const isFinalStep = workflow?.steps.find(s => s.id === currentStepId && !s.nextStepId);

    if (statusName === "Request Voided") return "destructive";
    if (statusName === "Request Rejected") return "destructive";
    if (isFinalStep) return "default"; // Approved/Completed
    if (statusName.toLowerCase().includes("pending") || statusName.toLowerCase().includes("approval") || statusName.toLowerCase().includes("review")) return "secondary";
    return "outline";
  };
  
  const isRequestEditable = (item: PurchaseOrderDisplayItem) => {
    // Simplified: editable if not "Request Voided", "Request Rejected", or at a final step like "Order Fulfilled/Closed"
    if (item.currentStepName === "Request Voided" || item.currentStepName === "Request Rejected") return false;
    const workflow = MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === item.workflowTemplateId);
    const isFinalStep = workflow?.steps.find(s => s.id === item.currentStepId && !s.nextStepId);
    return !isFinalStep;
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Purchase Order Requests"
        description="Manage and track all Purchase Order requests through their lifecycle."
        actions={
          <Button asChild>
            <Link href="/purchase-order/new">
              <PlusCircle className="w-4 h-4 mr-2" /> New Purchase Order
            </Link>
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="flex items-center"><ShoppingCart className="w-5 h-5 mr-2 text-primary"/>Purchase Order List</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <FilterIcon className="w-4 h-4 mr-2" /> Filters {isFiltersApplied && <span className="ml-2 h-2 w-2 rounded-full bg-primary animate-pulse"></span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4" align="end">
                <div>
                  <label htmlFor="date-range-po" className="text-sm font-medium">Submission Date Range</label>
                  <Calendar
                    id="date-range-po"
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    className="rounded-md border p-0 mt-1"
                    numberOfMonths={1}
                  />
                </div>
                <div>
                  <label htmlFor="filter-status-po" className="text-sm font-medium">Status</label>
                  <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val as RequestStatus)}>
                    <SelectTrigger id="filter-status-po" className="mt-1">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...REQUEST_STATUSES].map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => { setDateRange(undefined); setFilterStatus(""); setIsFiltersApplied(false); setCurrentPage(1); }}>Clear</Button>
                  <Button size="sm" onClick={() => { setIsFiltersApplied(true); setCurrentPage(1); }}>Apply</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <CardDescription>View, track, and manage all your Purchase Order requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute w-4 h-4 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by PO ID, Vendor, Requester, Status..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          {paginatedPOs.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>PO Date</TableHead>
                      <TableHead className="text-right">Total Value (INR)</TableHead>
                      <TableHead>Status / Current Step</TableHead>
                      <TableHead>Requester</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPOs.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Button variant="link" size="sm" className="p-0 h-auto font-medium" onClick={() => handleViewDetails(item)}>
                            {item.id}
                          </Button>
                        </TableCell>
                        <TableCell>{(item.payload as PurchaseOrderFormData).vendorName}</TableCell>
                        <TableCell>{format(new Date((item.payload as PurchaseOrderFormData).poDate), "yyyy-MM-dd")}</TableCell>
                        <TableCell className="text-right">
                          {(item.payload as PurchaseOrderFormData).items.reduce((sum, i) => {
                            const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
                            const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
                            return sum + itemTotal + itemGst;
                          }, 0).toLocaleString('en-IN', currencyFormattingOptions)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariantForPO(item.currentStepName, item.workflowTemplateId, item.currentStepId)} className="capitalize">
                            {item.currentStepName}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.requesterName}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" title="View Details" onClick={() => handleViewDetails(item)}><Eye className="w-4 h-4 text-primary" /></Button>
                          <Button variant="ghost" size="icon" title="Edit PO" disabled={!isRequestEditable(item)} onClick={() => toast({title: "Edit Action", description: "Link to PO form for editing (if status allows)."})}><Edit className="w-4 h-4 text-accent" /></Button>
                          <Button variant="ghost" size="icon" title="Void PO" disabled={!isRequestEditable(item)} onClick={() => handleOpenVoidDialog(item)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>
                    Showing {paginatedPOs.length} of {filteredPurchaseOrders.length} Purchase Orders.
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
              No Purchase Orders match your current search/filters, or no POs available.
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
                Purchase Order Details: {selectedRequestDetail.id}
              </DialogTitle>
              <DialogDescription>
                Detailed information, workflow progress, and approval timeline for PO {selectedRequestDetail.id}.
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
                       {(selectedRequestDetail.payload as PurchaseOrderFormData).kmKmgCode && <p><strong>KM/KMG Code:</strong> {(selectedRequestDetail.payload as PurchaseOrderFormData).kmKmgCode}</p>}
                        <p><strong>Cost Center:</strong> {(selectedRequestDetail.payload as PurchaseOrderFormData).costCenter}</p>
                        <p><strong>IO Number:</strong> {(selectedRequestDetail.payload as PurchaseOrderFormData).ioNumber}</p>
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

      {requestToVoid && (
        <AlertDialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-destructive"/>Confirm Void Request</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to void Purchase Order <strong>{requestToVoid.id}</strong>? This action cannot be undone.
                The request will be marked as 'Voided' and further processing will stop.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 my-4">
              <label htmlFor="voidReason" className="text-sm font-medium">Reason for Voiding (Optional)</label>
              <Textarea
                id="voidReason"
                placeholder="Enter reason..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => { setIsVoidDialogOpen(false); setVoidReason(""); }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmVoid} className="bg-destructive hover:bg-destructive/90">
                Confirm Void
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
