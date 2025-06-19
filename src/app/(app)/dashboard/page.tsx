
// src/app/(app)/dashboard/page.tsx
"use client";
import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardFooter as UICardFooter } from "@/components/ui/card";
import { Check, X, User, CalendarDays, Filter, LayoutGrid, List, Briefcase, Package, ShieldCheck, ShoppingCart, Tags, Recycle, Edit3, DollarSign, Truck, ChevronsUpDown, Eye, MessageSquare, Bell, ChevronsUp, Send, Info, History, Workflow as WorkflowIcon, Clock, Circle, CheckCircle, CircleDot, Loader2, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { type RequestType, type UserRole, DEPARTMENTS, MOCK_WORKFLOW_TEMPLATES, USER_ACTIONS, type UserAction, type WorkflowStep } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ApprovalSchema, type ApprovalFormData, type MaterialMovementFormData, type ScrapMovementFormData, type WorkPermitFormData, type PurchaseOrderFormData, type SaleOrderFormData, type OrderItem } from "@/lib/schemas";
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
  TableFooter,
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
import { cn } from "@/lib/utils";


type RequestPayload = MaterialMovementFormData | ScrapMovementFormData | WorkPermitFormData | PurchaseOrderFormData | SaleOrderFormData;

interface ApprovalHistoryItem {
  stepId: string;
  stepName: string;
  action: UserAction | "submitted" | "commented" | "reminded" | "escalated" | "system_auto_proceed";
  actor: string; // User ID or "System"
  timestamp: string;
  comment?: string;
}

interface ApprovalItem {
  id: string; // Unique ID for the request instance
  requestType: RequestType;
  requesterName: string;
  requesterDepartment: string;
  submissionDate: string; // ISO Date string
  currentStepId: string; // ID of the current WorkflowStep
  currentStepName: string;
  currentAssignees: UserRole[]; // Roles that can action the current step
  payload: RequestPayload;
  history: ApprovalHistoryItem[];
  workflowTemplateId: string; // To know which template it's following
}


const mockApprovalsData: ApprovalItem[] = [
  {
    id: "MM001", requestType: "Material Movement", requesterName: "Ram Kumar", requesterDepartment: "Production", submissionDate: "2024-07-28T10:00:00Z",
    currentStepId: "mm_receipt_confirmation", currentStepName: "Receipt Confirmation", currentAssignees: ["requester", "dispatch_team", "admin"], workflowTemplateId: "material_movement_default",
    payload: { materialType: "Raw Material", source: "Warehouse A", destination: "Production Line 1", quantity: 100, value: 150000, isReturnable: "no", vehicleNumber:"MH12AB1234" } as MaterialMovementFormData,
    history: [
        { stepId: "submission", stepName:"Submitted", actor: "Ram Kumar", action: "submitted", timestamp: "2024-07-28T10:00:00Z" },
        { stepId: "mm_dept_head_approval", stepName: "Department Head Approval", actor: "Prem Kumar", action: "approve", timestamp: "2024-07-28T11:00:00Z" },
        { stepId: "mm_dispatch_team_coordination", stepName: "Dispatch Team Coordination", actor: "Dispatch Team", action: "approve", timestamp: "2024-07-28T12:00:00Z" },
        { stepId: "mm_finance_check", stepName: "Finance Check (If Applicable)", actor: "Finance Team", action: "approve", timestamp: "2024-07-28T13:00:00Z" },
        { stepId: "mm_receipt_confirmation", stepName: "Pending Receipt Confirmation", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-28T13:01:00Z" },
    ]
  },
  {
    id: "SM002", requestType: "Scrap Request", requesterName: "Praveen S.", requesterDepartment: "Maintenance", submissionDate: "2024-07-27T14:30:00Z",
    currentStepId: "sm_finance_approval", currentStepName: "Finance Approval", currentAssignees: ["finance_team", "admin"], workflowTemplateId: "scrap_default", 
    payload: { scrapType: "E-waste", description: "Old monitors and keyboards", quantity: 10, weight: 50, gatePassNumber: "GP12345" } as ScrapMovementFormData,
    history: [
        { stepId: "submission", stepName:"Submitted", actor: "Praveen S.", action: "submitted", timestamp: "2024-07-27T14:30:00Z" },
        { stepId: "sm_dept_head_approval", stepName: "Department Head Approval", actor: "Prem Kumar", action: "approve", timestamp: "2024-07-27T15:00:00Z", comment: "Looks OK." },
        { stepId: "sm_finance_approval", stepName: "Pending Finance Approval", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-27T18:01:00Z" },
    ]
  },
  {
    id: "WP003", requestType: "Work Permit", requesterName: "Chandrasekar R.", requesterDepartment: "IT", submissionDate: "2024-07-29T09:15:00Z",
    currentStepId: "wp_safety_review", currentStepName: "Safety Team Review", currentAssignees: ["safety", "admin"], workflowTemplateId: "work_permit_default",
    payload: { building: "KOSMO Building", activityType: "Electrical Work (LV/MV/HV)", activityDetails: "Routine server maintenance in DC room 3", specificAreaOrEquipment: "DC Room 3", permitValidity: new Date() } as WorkPermitFormData,
    history: [
        { stepId: "submission", stepName:"Submitted", actor: "Chandrasekar R.", action: "submitted", timestamp: "2024-07-29T09:15:00Z" },
        { stepId: "wp_safety_review", stepName: "Pending Safety Review", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-29T09:16:00Z" },
    ]
  },
  {
    id: "PO004", requestType: "Purchase Order", requesterName: "Nagaraj V.", requesterDepartment: "Logistics", submissionDate: "2024-07-29T11:00:00Z",
    currentStepId: "po_dept_head", currentStepName: "Dept. Head Approval", currentAssignees: ["department_head", "admin"], workflowTemplateId: "po_default",
    payload: { vendorName: "Tech Solutions Inc.", poDate: new Date("2024-07-29"), items: [{itemName: "Laptop Model X", quantity: 5, unitPrice: 120000, hsnSacCode:"84713010", gstPercentage:18}], deliveryAddress: "Main Office", poCategory:"IT Equipment", department:"IT", costCenter:"IT001", ioNumber:"IO_IT004" } as PurchaseOrderFormData,
    history: [
        { stepId: "submission", stepName:"Submitted", actor: "Nagaraj V.", action: "submitted", timestamp: "2024-07-29T11:00:00Z"},
        { stepId: "po_dept_head", stepName: "Pending Dept. Head", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-29T11:01:00Z" },
    ]
  },
];

// Helper functions (adapted from AllRequestsPage)
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
        if (smPayload.gatePassNumber) details.push({key: "Gate Pass No.", value: <span className='flex items-center'><Hash className='w-3 h-3 mr-1'/>{smPayload.gatePassNumber}</span> });
        break;
      case "Work Permit":
        const wpPayload = payload as WorkPermitFormData;
        details.push({ key: "Building/Location", value: wpPayload.building });
        details.push({ key: "Permit Type/Activity", value: wpPayload.activityType });
        details.push({ key: "Specific Area/Equipment", value: wpPayload.specificAreaOrEquipment });
        details.push({ key: "Activity Details", value: <p className="whitespace-pre-wrap">{wpPayload.activityDetails}</p> });
        if(wpPayload.permitValidity) details.push({ key: "Permit Valid Until", value: new Date(wpPayload.permitValidity).toLocaleDateString() });
        break;
      case "Purchase Order":
        const poPayload = payload as PurchaseOrderFormData;
        details.push({ key: "PO Category", value: poPayload.poCategory });
        details.push({ key: "Department", value: poPayload.department });
        details.push({ key: "Vendor", value: poPayload.vendorName });
        if(poPayload.kmKmgCode) details.push({ key: "KM/KMG Code", value: poPayload.kmKmgCode });
        details.push({ key: "Cost Center", value: poPayload.costCenter });
        details.push({ key: "IO Number", value: poPayload.ioNumber });
        details.push({ key: "PO Date", value: new Date(poPayload.poDate).toLocaleDateString() });
        details.push({ key: "Delivery Address", value: poPayload.deliveryAddress });
        if(poPayload.paymentTerms) details.push({ key: "Payment Terms", value: poPayload.paymentTerms });
        if(poPayload.segment) details.push({ key: "Segment", value: poPayload.segment });
        details.push({ key: "Items", value: (
          <Table className="mt-2 text-xs">
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead>HSN/SAC</TableHead><TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
            {poPayload.items.map((item, idx) => {
              const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
              const itemGst = itemTotal * ((item.gstPercentage || 0) / 100);
              const lineTotal = itemTotal + itemGst;
              return (
              <TableRow key={idx}><TableCell>{item.itemName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{item.unitPrice.toLocaleString('en-IN', formattingOptions)}</TableCell><TableCell>{item.hsnSacCode || 'N/A'}</TableCell><TableCell className="text-right">{item.gstPercentage ? `${item.gstPercentage}%` : 'N/A'}</TableCell><TableCell className="text-right">{lineTotal.toLocaleString('en-IN', formattingOptions)}</TableCell></TableRow>
              );
            })}
            </TableBody>
             <TableFooter><TableRow><TableCell colSpan={5} className="text-right font-bold">Grand Total</TableCell><TableCell className="text-right font-bold">{poPayload.items.reduce((sum, i) => {
                const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
                const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
                return sum + itemTotal + itemGst;
             }, 0).toLocaleString('en-IN', formattingOptions)}</TableCell></TableRow></TableFooter>
          </Table>
        )});
        if(poPayload.remarks) details.push({ key: "Remarks", value: <p className="whitespace-pre-wrap">{poPayload.remarks}</p> });
        break;
      case "Sale Order":
        const soPayload = payload as SaleOrderFormData;
        details.push({ key: "Customer", value: soPayload.customerName });
        details.push({ key: "SO Date", value: new Date(soPayload.soDate).toLocaleDateString() });
        details.push({ key: "Project/CR No.", value: soPayload.projectOrCrNo });
        details.push({ key: "SO Category", value: soPayload.saleOrderCategory });
        details.push({ key: "Purpose", value: <p className="whitespace-pre-wrap">{soPayload.purpose}</p> });
        details.push({ key: "Cost Center", value: soPayload.costCenter });
        details.push({ key: "IO Number", value: soPayload.ioNumber });
        details.push({ key: "Budget Amount", value: soPayload.budgetAmount.toLocaleString('en-IN', formattingOptions) });
        details.push({ key: "Material Req. Date", value: new Date(soPayload.materialRequiredDate).toLocaleDateString() });
        details.push({ key: "Dept. Head Approval", value: soPayload.departmentHeadApproval });
        details.push({ key: "Delivery To", value: soPayload.deliveryTo });
         details.push({ key: "Items", value: (
            <Table className="mt-2 text-xs">
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead>HSN/SAC</TableHead><TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
            <TableBody>
            {soPayload.items.map((item, idx) => {
              const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
              const itemGst = itemTotal * ((item.gstPercentage || 0) / 100);
              const lineTotal = itemTotal + itemGst;
              return(
              <TableRow key={idx}><TableCell>{item.itemName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{item.unitPrice.toLocaleString('en-IN', formattingOptions)}</TableCell><TableCell>{item.hsnSacCode || 'N/A'}</TableCell><TableCell className="text-right">{item.gstPercentage ? `${item.gstPercentage}%` : 'N/A'}</TableCell><TableCell className="text-right">{lineTotal.toLocaleString('en-IN', formattingOptions)}</TableCell></TableRow>
              );
            })}
            </TableBody>
            <TableFooter><TableRow><TableCell colSpan={5} className="text-right font-bold">Grand Total</TableCell><TableCell className="text-right font-bold">{soPayload.items.reduce((sum, i) => {
                const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
                const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
                return sum + itemTotal + itemGst;
            }, 0).toLocaleString('en-IN', formattingOptions)}</TableCell></TableRow></TableFooter>
          </Table>
        )});
        if(soPayload.remarks) details.push({ key: "Remarks", value: <p className="whitespace-pre-wrap">{soPayload.remarks}</p> });
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

const renderWorkflowProgress = (request: ApprovalItem) => {
    const workflow = MOCK_WORKFLOW_TEMPLATES.find(wt => wt.id === request.workflowTemplateId);
    if (!workflow) return <p className="text-sm text-muted-foreground">Workflow details not available.</p>;

    const currentStepIndex = workflow.steps.findIndex(step => step.id === request.currentStepId);
    
    return (
      <div className="space-y-0">
        {workflow.steps.map((step, index) => {
          const historyForStep = request.history.filter(h => h.stepId === step.id && h.action === "approve");
          const isCompleted = historyForStep.length > 0;
          const isCurrent = step.id === request.currentStepId && !isCompleted && 
                           (request.history.some(h => h.stepId === step.id && (h.action === "system_auto_proceed" || h.action === "submitted")) || currentStepIndex === index );
          
          let icon;
          let textClass = "text-muted-foreground/80"; 
          let roleClass = "text-muted-foreground/80"; 
          let lineClass = "bg-border"; 

          if (isCompleted) {
            icon = <CheckCircle className="w-5 h-5 text-primary" />;
            textClass = "text-primary";
            roleClass = "text-primary";
            lineClass = "bg-primary";
          } else if (isCurrent) {
            icon = <Clock className="w-5 h-5 text-[hsl(var(--chart-2))] animate-pulse" />; 
            textClass = "text-[hsl(var(--chart-2))] font-semibold";
            roleClass = "text-[hsl(var(--chart-2))]";
            lineClass = "bg-[hsl(var(--chart-2))]";
          } else { 
            icon = <Circle className="w-5 h-5 text-muted-foreground/60" />;
          }
          
          const isInitialCurrentStep = isCurrent && index === 0 && request.history.every(h => h.stepId === step.id ? (h.action === "system_auto_proceed" || h.action === "submitted") : true);
          if(isInitialCurrentStep && !isCompleted) {
             lineClass = "bg-[hsl(var(--chart-2))]"; 
          }

          return (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center mr-4">
                {icon}
                {index < workflow.steps.length - 1 && (
                  <div className={cn( "w-px h-10 mt-1", lineClass )} />
                )}
              </div>
              <div className={cn("pb-10", index === workflow.steps.length -1 && "pb-0")}>
                <p className={cn("text-sm", textClass)}>{step.name}</p>
                <p className={cn("text-xs", roleClass)}>
                  Assigned: {step.assignedRoles.map(r => r.charAt(0).toUpperCase() + r.slice(1).replace(/_/g, ' ')).join(', ')}
                </p>
                 {isCompleted && historyForStep[0]?.timestamp && (
                  <p className="text-xs text-muted-foreground">Completed: {new Date(historyForStep[0].timestamp).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };


export default function ApprovalsDashboardPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>(mockApprovalsData);
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
    if(user.role === 'admin') return approvals; 
    return approvals.filter(item => 
      item.currentAssignees.includes(user.role) || 
      (item.currentAssignees.includes('department_head') && user.department && item.requesterDepartment === user.department)
    );
  }, [approvals, user]);

  const handleViewDetails = (item: ApprovalItem) => {
    setSelectedRequestDetail(item);
    setIsDetailDialogOpen(true);
  };

  const handleApprovalAction = (itemId: string, action: UserAction, comment?: string) => {
    const item = approvals.find(ap => ap.id === itemId);
    if (!item || !user) return;

    const newHistoryEntry: ApprovalHistoryItem = {
        stepId: item.currentStepId,
        stepName: item.currentStepName,
        action: action,
        actor: user.displayName || user.email || "Current User (Ram Kumar)",
        timestamp: new Date().toISOString(),
        comment: comment,
    };
    
    const currentWorkflow = MOCK_WORKFLOW_TEMPLATES.find(wf => wf.id === item.workflowTemplateId);
    const currentStepConfig = currentWorkflow?.steps.find(s => s.id === item.currentStepId);
    let nextStep: WorkflowStep | undefined;
    let updatedApprovals = [...approvals];

    if (action === 'approve' && currentStepConfig?.nextStepId) {
        nextStep = currentWorkflow?.steps.find(s => s.id === currentStepConfig.nextStepId);
    } else if (action === 'reject' && currentStepConfig?.rejectionLeadsToStepId) {
        nextStep = currentWorkflow?.steps.find(s => s.id === currentStepConfig.rejectionLeadsToStepId);
    } else if (action === 'reject' && !currentStepConfig?.rejectionLeadsToStepId) { // Rejection leads to request closure or back to requester if no specific step
        // For mock, simply remove from list. Real app might set a 'rejected_closed' status
        updatedApprovals = approvals.map(ap => 
            ap.id === itemId ? {
                ...ap,
                currentStepId: "request_rejected_final", // Fictional final rejected state
                currentStepName: "Request Rejected",
                currentAssignees: [], // No further assignees
                history: [...ap.history, newHistoryEntry]
            } : ap
        ).filter(ap => ap.id !== itemId); // Or keep it with the final rejected status
        setApprovals(updatedApprovals);
        toast({
          title: `Request ${action === "approve" ? "Approved" : "Rejected"}`,
          description: `Request ID ${itemId} has been processed.`,
        });
        form.reset();
        return; // Exit early as it's removed or terminally updated
    }


    if (nextStep) {
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
                }]
            } : ap
        );
        setApprovals(updatedApprovals);
    } else { // This handles final approval where there's no nextStepId
        updatedApprovals = approvals.map(ap => 
            ap.id === itemId ? {
                ...ap,
                currentStepId: "request_approved_final", // Fictional final approved state
                currentStepName: "Request Approved & Closed",
                currentAssignees: [],
                history: [...ap.history, newHistoryEntry]
            } : ap
        ).filter(ap => ap.id !== itemId); // For mock, remove from active list
        setApprovals(updatedApprovals);
    }
    
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
          actor: user.displayName || "Current User (Ram Kumar)", 
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

  const renderRequestPayloadSummary = (item: ApprovalItem): string => {
    const { requestType, payload } = item;
    const formattingOptions: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  
    switch (requestType) {
      case "Material Movement":
        const mm = payload as MaterialMovementFormData;
        return `Move ${mm.quantity} x ${mm.materialType} from ${mm.source} to ${mm.destination}. Value: ${mm.value.toLocaleString('en-IN', formattingOptions)}`;
      case "Scrap Request":
        const sm = payload as ScrapMovementFormData;
        return `Dispose ${sm.quantity} units of ${sm.scrapType} (${sm.weight} units weight). ${sm.gatePassNumber ? `GP: ${sm.gatePassNumber}`: ''}`;
      case "Work Permit":
        const wp = payload as WorkPermitFormData;
        return `Permit for ${wp.activityType} in ${wp.building}. Area: ${wp.specificAreaOrEquipment}.`;
      case "Purchase Order":
        const po = payload as PurchaseOrderFormData;
        const poTotal = po.items.reduce((sum, i) => {
          const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
          const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
          return sum + itemTotal + itemGst;
        }, 0);
        return `PO for ${po.vendorName}. ${po.items.length} item(s). Total: ${poTotal.toLocaleString('en-IN', formattingOptions)}`;
      case "Sale Order":
        const so = payload as SaleOrderFormData;
        const soTotal = so.items.reduce((sum, i) => {
          const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
          const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
          return sum + itemTotal + itemGst;
        }, 0);
        return `SO for ${so.customerName}. ${so.items.length} item(s). Total: ${soTotal.toLocaleString('en-IN', formattingOptions)}`;
      default:
        return "Details not available.";
    }
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
          </div>
        }
      />

      {userVisibleApprovals.length === 0 ? (
        <Card>
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
                      <p className="text-muted-foreground text-xs">{renderRequestPayloadSummary(item)}</p>
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
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={renderRequestPayloadSummary(item)}>
                            {renderRequestPayloadSummary(item)}
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
        </>
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
                      {/* Mock Remind/Escalate buttons - functionality not fully implemented */}
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
