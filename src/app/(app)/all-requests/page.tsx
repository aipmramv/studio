
// src/app/(app)/all-requests/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardFooter as UICardFooter, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Truck, Recycle, ShieldCheck, ShoppingCart, Tags, Package, CalendarDays, User, MessageSquare, Bell, ChevronsUp, Send, Info, History, CheckCircle, CircleDot, Circle, Workflow as WorkflowIcon } from "lucide-react";
import { type RequestType, type UserRole, type UserAction, MOCK_WORKFLOW_TEMPLATES, type WorkflowTemplate, type WorkflowStep } from "@/lib/constants";
import { type MaterialMovementFormData, type ScrapMovementFormData, type WorkPermitFormData, type PurchaseOrderFormData, type SaleOrderFormData, type OrderItem } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type RequestPayload = MaterialMovementFormData | ScrapMovementFormData | WorkPermitFormData | PurchaseOrderFormData | SaleOrderFormData;

interface ApprovalHistoryItem {
  stepId: string;
  stepName: string;
  action: UserAction | "submitted" | "commented" | "reminded" | "escalated" | "system_auto_proceed";
  actor: string; 
  timestamp: string; 
  comment?: string;
}

interface ApprovalItem {
  id: string;
  requestType: RequestType;
  requesterName: string;
  requesterDepartment: string;
  submissionDate: string;
  currentStepId: string;
  currentStepName: string;
  workflowTemplateId: string; 
  payload: RequestPayload;
  history: ApprovalHistoryItem[];
}

const mockAllRequestsData: ApprovalItem[] = [
  {
    id: "MM001", requestType: "Material Movement", requesterName: "Alice Smith", requesterDepartment: "Production", submissionDate: "2024-07-28T10:00:00Z",
    currentStepId: "mm_dept_head", currentStepName: "Department Head Approval", workflowTemplateId: "material_movement_default",
    payload: { materialType: "Raw Material", source: "Warehouse A", destination: "Production Line 1", quantity: 100, value: 150000, isReturnable: "no", vehicleNumber:"MH12AB1234" } as MaterialMovementFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Alice Smith", action: "submitted", timestamp: "2024-07-28T10:00:00Z", comment: "Initial submission for urgent production requirement." },
      { stepId: "mm_dept_head", stepName: "Pending Dept. Head", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-28T10:01:00Z" },
    ]
  },
  {
    id: "SM002", requestType: "Scrap Request", requesterName: "Bob Johnson", requesterDepartment: "Maintenance", submissionDate: "2024-07-27T14:30:00Z",
    currentStepId: "sm_ehs_clearance", currentStepName: "EHS Clearance", workflowTemplateId: "scrap_default",
    payload: { scrapType: "E-waste", description: "Old monitors and keyboards, non-functional", quantity: 10, weight: 50 } as ScrapMovementFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Bob Johnson", action: "submitted", timestamp: "2024-07-27T14:30:00Z" },
      { stepId: "sm_supervisor_approval", stepName: "Supervisor Approval", actor: "Maintenance Lead", action: "approve", timestamp: "2024-07-27T15:00:00Z", comment: "Looks OK." },
      { stepId: "sm_ehs_clearance", stepName: "Pending EHS Clearance", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-27T15:01:00Z" },
    ]
  },
  {
    id: "WP003", requestType: "Work Permit", requesterName: "Carol White", requesterDepartment: "IT", submissionDate: "2024-07-29T09:15:00Z",
    currentStepId: "wp_safety_review", currentStepName: "Safety Team Review", workflowTemplateId: "work_permit_default",
    payload: { building: "KOSMO", activityType: "Server Maintenance", activityDetails: "Routine server maintenance in DC room 3. Includes rack mounting and cable management." } as WorkPermitFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Carol White", action: "submitted", timestamp: "2024-07-29T09:15:00Z" },
      { stepId: "wp_safety_review", stepName: "Pending Safety Review", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-29T09:16:00Z"}
    ]
  },
  {
    id: "PO004", requestType: "Purchase Order", requesterName: "David Brown", requesterDepartment: "Logistics", submissionDate: "2024-07-29T11:00:00Z",
    currentStepId: "po_dept_head", currentStepName: "Dept. Head Approval", workflowTemplateId: "po_default",
    payload: { vendorName: "Tech Solutions Inc.", poDate: new Date("2024-07-29"), items: [{itemName: "Laptop Model X", quantity: 5, unitPrice: 1200, hsnSacCode:"84713010", gstPercentage:18}, {itemName: "Docking Station", quantity: 5, unitPrice: 150, hsnSacCode:"84718000", gstPercentage:18}], deliveryAddress: "Main Office, R&D Block", paymentTerms: "Net 30" } as PurchaseOrderFormData,
     history: [
      { stepId: "submission", stepName: "Submitted", actor: "David Brown", action: "submitted", timestamp: "2024-07-29T11:00:00Z" },
      { stepId: "po_dept_head", stepName: "Pending Dept. Head Approval", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-29T11:01:00Z"}
    ]
  },
   {
    id: "SO005", requestType: "Sale Order", requesterName: "Eve Green", requesterDepartment: "Sales", submissionDate: "2024-07-30T11:00:00Z",
    currentStepId: "so_manager_approval", currentStepName: "Sales Manager Approval", workflowTemplateId: "so_default",
    payload: { customerName: "Client ABC Corp", soDate: new Date("2024-07-30"), items: [{itemName: "Software License - Annual", quantity: 10, unitPrice: 5000, hsnSacCode: "997331", gstPercentage: 18}], shippingAddress: "Client HQ, Tower B, Floor 5", billingAddress: "Client HQ, Accounts Dept.", projectOrCrNo:"PROJ123", saleOrderCategory:"Software", purpose:"Annual License Renewal", costCenter:"SALES01", ioNumber:"IO_SALES005", budgetAmount:500000, materialRequiredDate:new Date("2024-08-15"), departmentHeadApproval:"Sales Head", deliveryTo:"IT Dept Contact" } as SaleOrderFormData,
     history: [
      { stepId: "submission", stepName: "Submitted", actor: "Eve Green", action: "submitted", timestamp: "2024-07-30T11:00:00Z" },
      { stepId: "so_manager_approval", stepName: "Pending Sales Manager Approval", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-30T11:01:00Z"}
    ]
  },
];

const getRequestTypeIcon = (requestType: RequestType, className?: string) => {
  const props = { className: cn("w-4 h-4 mr-2 text-muted-foreground", className) };
  switch (requestType) {
    case "Material Movement": return <Truck {...props} />;
    case "Scrap Request": return <Recycle {...props} />;
    case "Work Permit": return <ShieldCheck {...props} />;
    case "Purchase Order": return <ShoppingCart {...props} />;
    case "Sale Order": return <Tags {...props} />;
    default: return <Package {...props} />;
  }
};

const renderRequestSummary = (item: ApprovalItem): string => {
  const { requestType, payload } = item;
  const formattingOptions: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  switch (requestType) {
    case "Material Movement":
      const mm = payload as MaterialMovementFormData;
      return `${mm.quantity} x ${mm.materialType} from ${mm.source} to ${mm.destination}. Value: ${mm.value.toLocaleString('en-IN', formattingOptions)}`;
    case "Scrap Request":
      const sm = payload as ScrapMovementFormData;
      return `${sm.quantity} units of ${sm.scrapType} (${sm.weight} units weight). Desc: ${sm.description.substring(0,50)}...`;
    case "Work Permit":
      const wp = payload as WorkPermitFormData;
      return `For ${wp.activityType} in ${wp.building}. Details: ${wp.activityDetails.substring(0,50)}...`;
    case "Purchase Order":
      const po = payload as PurchaseOrderFormData;
      const poTotal = po.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
      return `Vendor: ${po.vendorName}. ${po.items.length} item(s). Total: ${poTotal.toLocaleString('en-IN', formattingOptions)}`;
    case "Sale Order":
      const so = payload as SaleOrderFormData;
      const soTotal = so.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
      return `Customer: ${so.customerName}. ${so.items.length} item(s). Total: ${soTotal.toLocaleString('en-IN', formattingOptions)}`;
    default:
      return "Details not available.";
  }
};

const renderRequestPayloadDetailsDialog = (payload: RequestPayload, requestType: RequestType) => {
    const details: {key: string, value: string | number | undefined | React.ReactNode }[] = [];
    const formattingOptions: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

    switch (requestType) {
      case "Material Movement":
        const mmPayload = payload as MaterialMovementFormData;
        details.push({ key: "Material Type", value: mmPayload.materialType });
        details.push({ key: "Source", value: mmPayload.source });
        details.push({ key: "Destination", value: mmPayload.destination });
        details.push({ key: "Quantity", value: mmPayload.quantity });
        details.push({ key: "Value", value: mmPayload.value.toLocaleString('en-IN', formattingOptions) });
        details.push({ key: "Returnable", value: mmPayload.isReturnable });
        if (mmPayload.vehicleNumber) details.push({ key: "Vehicle No.", value: mmPayload.vehicleNumber });
        break;
      case "Scrap Request":
        const smPayload = payload as ScrapMovementFormData;
        details.push({ key: "Scrap Type", value: smPayload.scrapType });
        details.push({ key: "Description", value: <p className="whitespace-pre-wrap">{smPayload.description}</p> });
        details.push({ key: "Quantity", value: smPayload.quantity });
        details.push({ key: "Weight", value: `${smPayload.weight} (units)` });
        break;
      case "Work Permit":
        const wpPayload = payload as WorkPermitFormData;
        details.push({ key: "Building", value: wpPayload.building });
        details.push({ key: "Activity Type", value: wpPayload.activityType });
        details.push({ key: "Activity Details", value: <p className="whitespace-pre-wrap">{wpPayload.activityDetails}</p> });
        break;
      case "Purchase Order":
        const poPayload = payload as PurchaseOrderFormData;
        details.push({ key: "Vendor", value: poPayload.vendorName });
        details.push({ key: "PO Date", value: new Date(poPayload.poDate).toLocaleDateString() });
        details.push({ key: "Delivery Address", value: poPayload.deliveryAddress });
        if(poPayload.paymentTerms) details.push({ key: "Payment Terms", value: poPayload.paymentTerms });
        details.push({ key: "Items", value: (
          <Table className="mt-2 text-xs">
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
            {poPayload.items.map((item, idx) => (
              <TableRow key={idx}><TableCell>{item.itemName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{item.unitPrice.toLocaleString('en-IN', formattingOptions)}</TableCell><TableCell className="text-right">{(item.quantity * item.unitPrice).toLocaleString('en-IN', formattingOptions)}</TableCell></TableRow>
            ))}
            </TableBody>
             <TableFooter><TableRow><TableCell colSpan={3} className="text-right font-bold">Grand Total</TableCell><TableCell className="text-right font-bold">{poPayload.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0).toLocaleString('en-IN', formattingOptions)}</TableCell></TableRow></TableFooter>
          </Table>
        )});
        break;
      case "Sale Order":
        const soPayload = payload as SaleOrderFormData;
        details.push({ key: "Customer", value: soPayload.customerName });
        details.push({ key: "SO Date", value: new Date(soPayload.soDate).toLocaleDateString() });
        details.push({ key: "Shipping Address", value: soPayload.shippingAddress });
        details.push({ key: "Billing Address", value: soPayload.billingAddress });
         details.push({ key: "Items", value: (
            <Table className="mt-2 text-xs">
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
            {soPayload.items.map((item, idx) => (
              <TableRow key={idx}><TableCell>{item.itemName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{item.unitPrice.toLocaleString('en-IN', formattingOptions)}</TableCell><TableCell className="text-right">{(item.quantity * item.unitPrice).toLocaleString('en-IN', formattingOptions)}</TableCell></TableRow>
            ))}
            </TableBody>
            <TableFooter><TableRow><TableCell colSpan={3} className="text-right font-bold">Grand Total</TableCell><TableCell className="text-right font-bold">{soPayload.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0).toLocaleString('en-IN', formattingOptions)}</TableCell></TableRow></TableFooter>
          </Table>
        )});
        break;
      default:
        details.push({ key: "Details", value: "No specific details available for this request type." });
    }
    return details.map(detail => (
      <div key={detail.key} className="text-sm text-muted-foreground mb-1">
        <span className="capitalize font-medium text-foreground">{detail.key}: </span>{typeof detail.value === 'string' || typeof detail.value === 'number' ? detail.value : <div className="mt-1">{detail.value}</div>}
      </div>
    ));
  };


export default function AllRequestsPage() {
  const [requests, setRequests] = React.useState<ApprovalItem[]>(mockAllRequestsData);
  const [selectedRequest, setSelectedRequest] = React.useState<ApprovalItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const { toast } = useToast();

  const handleViewDetails = (item: ApprovalItem) => {
    setSelectedRequest(item);
    setIsDetailDialogOpen(true);
  };

  const handleAddComment = () => {
    if (!selectedRequest || !newComment.trim()) {
      toast({ title: "Cannot add empty comment", variant: "destructive" });
      return;
    }
    const updatedRequest = {
      ...selectedRequest,
      history: [
        ...selectedRequest.history,
        {
          stepId: "comment",
          stepName: "Comment Added",
          actor: "Current User (Mock)", 
          action: "commented",
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
    if (!selectedRequest) return;
    toast({ title: "Reminder Sent (Mock)", description: `A reminder has been sent for request ${selectedRequest.id}.`});
  };
  
  const handleEscalate = () => {
    if (!selectedRequest) return;
    toast({ title: "Request Escalated (Mock)", description: `Request ${selectedRequest.id} has been escalated.`});
  };

  const renderWorkflowProgress = (request: ApprovalItem) => {
    const workflow = MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === request.workflowTemplateId);
    if (!workflow) return <p className="text-sm text-muted-foreground">Workflow details not available.</p>;

    const currentStepIndex = workflow.steps.findIndex(step => step.id === request.currentStepId);

    return (
      <div className="space-y-0">
        {workflow.steps.map((step, index) => {
          const isCompleted = request.history.some(h => h.stepId === step.id && h.action === "approve") && step.id !== request.currentStepId;
          const isCurrent = step.id === request.currentStepId;
          
          let icon;
          let textClass = "text-muted-foreground";
          let roleClass = "text-muted-foreground";

          if (isCompleted) {
            icon = <CheckCircle className="w-5 h-5 text-green-500" />;
            textClass = "text-green-600";
            roleClass = "text-green-500";
          } else if (isCurrent) {
            icon = <CircleDot className="w-5 h-5 text-primary" />;
            textClass = "text-primary font-semibold";
            roleClass = "text-primary";
          } else { 
            icon = <Circle className="w-5 h-5 text-muted-foreground/50" />;
             textClass = "text-muted-foreground/70";
             roleClass = "text-muted-foreground/70";
          }
          
          return (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center mr-4">
                {icon}
                {index < workflow.steps.length - 1 && (
                  <div className={cn(
                      "w-px h-8 mt-1",
                      (isCompleted && index < currentStepIndex) || isCurrent ? "bg-primary/50" : "bg-border"
                    )} />
                )}
              </div>
              <div className="pb-8">
                <p className={cn("text-sm", textClass)}>{step.name}</p>
                <p className={cn("text-xs", roleClass)}>Assigned: {step.assignedRoles.join(', ').replace(/_/g, ' ')}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="All Requests"
        description="View a consolidated list of all ongoing and completed requests across the system."
      />
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Request Overview</CardTitle>
          <CardDescription>
            This table shows all types of requests. Click 'View' for detailed information and actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requester</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status / Current Step</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell className="flex items-center">
                      {getRequestTypeIcon(item.requestType)}
                      {item.requestType}
                    </TableCell>
                    <TableCell>{item.requesterName} ({item.requesterDepartment})</TableCell>
                    <TableCell>{new Date(item.submissionDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {item.currentStepName.toLowerCase()}
                      </Badge>
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
              <TableCaption>{requests.length} request(s) found.</TableCaption>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">No requests found.</p>
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
              <DialogTitle className="flex items-center">
                {getRequestTypeIcon(selectedRequest.requestType, "w-6 h-6 mr-2 text-primary")}
                Request Details: {selectedRequest.id}
                <Badge variant="outline" className="ml-auto capitalize">{selectedRequest.requestType}</Badge>
              </DialogTitle>
              <DialogDescription>
                Detailed information, workflow progress, and approval timeline for request {selectedRequest.id}.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100vh-20rem)] pr-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                <div className="md:col-span-2 space-y-4"> 
                  <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center"><Info className="w-5 h-5 mr-2 text-primary"/>Basic Information</CardTitle></CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      <p><strong>Requester:</strong> {selectedRequest.requesterName} ({selectedRequest.requesterDepartment})</p>
                      <p><strong>Submitted:</strong> {new Date(selectedRequest.submissionDate).toLocaleString()}</p>
                      <p><strong>Current Step:</strong> {selectedRequest.currentStepName}</p>
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
                              <p className="font-semibold">{entry.stepName} - <span className="capitalize font-normal">{entry.action.replace("_", " ")}</span></p>
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
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
