
// src/app/(app)/all-requests/page.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Truck, Recycle, ShieldCheck, ShoppingCart, Tags, Package, CalendarDays, User, MessageSquare, Bell, ChevronsUp, Send, Info, History, CheckCircle, CircleDot, Circle, Workflow as WorkflowIcon, Clock, Search, Filter as FilterIcon, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { type RequestType, type UserRole, type UserAction, MOCK_WORKFLOW_TEMPLATES, type WorkflowTemplate, type WorkflowStep, DEPARTMENTS } from "@/lib/constants";
import { type MaterialMovementFormData, type ScrapMovementFormData, type WorkPermitFormData, type PurchaseOrderFormData, type SaleOrderFormData, type OrderItem } from "@/lib/schemas";
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
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DateRange } from "react-day-picker";

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
  requesterDepartment: typeof DEPARTMENTS[number] | "External";
  submissionDate: string; // ISO Date string
  currentStepId: string;
  currentStepName: string;
  workflowTemplateId: string; 
  payload: RequestPayload;
  history: ApprovalHistoryItem[];
}

const ITEMS_PER_PAGE = 10;

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
    currentStepId: "wp_maintenance_review", currentStepName: "Maintenance Team Review", workflowTemplateId: "work_permit_default",
    payload: { activityType: "Electrical Work (LV/MV/HV)", building: "KOSMO Building", activityDetails: "Routine server maintenance in DC room 3. Includes rack mounting and cable management.", specificAreaOrEquipment: "DC Room 3, Rack A5", permitValidity: new Date("2024-08-05") } as WorkPermitFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Carol White", action: "submitted", timestamp: "2024-07-29T09:15:00Z" },
      { stepId: "wp_safety_review", stepName: "Safety Team Review", actor: "Safety Officer", action: "approve", timestamp: "2024-07-29T14:00:00Z", comment: "Safety protocols confirmed." },
      { stepId: "wp_maintenance_review", stepName: "Pending Maintenance Review", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-29T14:01:00Z"}
    ]
  },
  {
    id: "PO004", requestType: "Purchase Order", requesterName: "David Brown", requesterDepartment: "Logistics", submissionDate: "2024-07-29T11:00:00Z",
    currentStepId: "po_dept_head", currentStepName: "Dept. Head Approval", workflowTemplateId: "po_default",
    payload: { poCategory: "IT Equipment", department: "IT", vendorName: "Tech Solutions Inc.", kmKmgCode: "KM123", costCenter: "CC_IT_001_Infra", ioNumber: "IO_IT_2024_004", poDate: new Date("2024-07-29"), items: [{itemName: "Laptop Model X", quantity: 5, unitPrice: 120000, hsnSacCode:"84713010", gstPercentage:18}, {itemName: "Docking Station", quantity: 5, unitPrice: 15000, hsnSacCode:"84718000", gstPercentage:18}], deliveryAddress: "Main Office, R&D Block", segment: "Hardware Refresh" } as PurchaseOrderFormData,
     history: [
      { stepId: "submission", stepName: "Submitted", actor: "David Brown", action: "submitted", timestamp: "2024-07-29T11:00:00Z" },
      { stepId: "po_dept_head", stepName: "Pending Dept. Head Approval", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-29T11:01:00Z"}
    ]
  },
   {
    id: "SO005", requestType: "Sale Order", requesterName: "Eve Green", requesterDepartment: "Sales", submissionDate: "2024-07-30T11:00:00Z",
    currentStepId: "so_manager_approval", currentStepName: "Sales Manager Approval", workflowTemplateId: "so_default",
    payload: { customerName: "Client ABC Corp", soDate: new Date("2024-07-30"), projectOrCrNo:"PROJ123", saleOrderCategory:"Software", purpose:"Annual License Renewal", costCenter:"CC_SALES_001", ioNumber:"IO_SALES_2024_005", budgetAmount:500000, materialRequiredDate:new Date("2024-08-15"), departmentHeadApproval:"Sales Head", deliveryTo:"IT Dept Contact", items: [{itemName: "Software License - Annual", quantity: 10, unitPrice: 50000, hsnSacCode: "997331", gstPercentage: 18}], shippingAddress: "Client HQ, Tower B, Floor 5", billingAddress: "Client HQ, Accounts Dept." } as SaleOrderFormData,
     history: [
      { stepId: "submission", stepName: "Submitted", actor: "Eve Green", action: "submitted", timestamp: "2024-07-30T11:00:00Z" },
      { stepId: "so_manager_approval", stepName: "Pending Sales Manager Approval", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-30T11:01:00Z"}
    ]
  },
  {
    id: "MM006", requestType: "Material Movement", requesterName: "Frank Wright", requesterDepartment: "Logistics", submissionDate: "2024-08-01T10:00:00Z",
    currentStepId: "mm_finance_check", currentStepName: "Finance Check (High Value)", workflowTemplateId: "material_movement_default",
    payload: { materialType: "Finished Goods", source: "Main Warehouse", destination: "Shipping Dock", quantity: 50, value: 250000, isReturnable: "no", vehicleNumber:"MH14CD5678" } as MaterialMovementFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Frank Wright", action: "submitted", timestamp: "2024-08-01T10:00:00Z" },
      { stepId: "mm_dept_head", stepName: "Department Head Approval", actor: "Logistics Head", action: "approve", timestamp: "2024-08-01T11:30:00Z" },
      { stepId: "mm_finance_check", stepName: "Pending Finance Check", actor: "System", action: "system_auto_proceed", timestamp: "2024-08-01T11:31:00Z" },
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
      return `Move ${mm.quantity} x ${mm.materialType} from ${mm.source} to ${mm.destination}. Value: ${mm.value.toLocaleString('en-IN', formattingOptions)}`;
    case "Scrap Request":
      const sm = payload as ScrapMovementFormData;
      return `${sm.quantity} units of ${sm.scrapType} (${sm.weight} units weight). Desc: ${sm.description.substring(0,50)}...`;
    case "Work Permit":
      const wp = payload as WorkPermitFormData;
      return `For ${wp.activityType} in ${wp.building}. Area: ${wp.specificAreaOrEquipment}. Details: ${wp.activityDetails.substring(0,30)}...`;
    case "Purchase Order":
      const po = payload as PurchaseOrderFormData;
      const poTotal = po.items.reduce((sum, i) => {
        const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
        const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
        return sum + itemTotal + itemGst;
      }, 0);
      return `Vendor: ${po.vendorName}. ${po.items.length} item(s). Total: ${poTotal.toLocaleString('en-IN', formattingOptions)}`;
    case "Sale Order":
      const so = payload as SaleOrderFormData;
      const soTotal = so.items.reduce((sum, i) => {
        const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
        const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
        return sum + itemTotal + itemGst;
      }, 0);
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


export default function AllRequestsPage() {
  const [requests, setRequests] = React.useState<ApprovalItem[]>(mockAllRequestsData);
  const [selectedRequest, setSelectedRequest] = React.useState<ApprovalItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = React.useState(false);
  const [newComment, setNewComment] = React.useState("");
  const { toast } = useToast();

  // State for filters and search
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
        req.requesterName.toLowerCase().includes(filterRequester.toLowerCase()) ||
        (req.payload as any).email?.toLowerCase().includes(filterRequester.toLowerCase()) // Assuming email might be in payload
      );
    }
    if (filterStatus) {
      tempRequests = tempRequests.filter(req => req.currentStepName === filterStatus);
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
          stepId: selectedRequest.currentStepId, 
          stepName: `Comment on: ${selectedRequest.currentStepName}`,
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
     const updatedRequest = {
      ...selectedRequest,
      history: [
        ...selectedRequest.history,
        {
          stepId: selectedRequest.currentStepId,
          stepName: "Reminder Sent",
          actor: "Current User (Mock)",
          action: "reminded",
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
    if (!selectedRequest) return;
     const updatedRequest = {
      ...selectedRequest,
      history: [
        ...selectedRequest.history,
        {
          stepId: selectedRequest.currentStepId,
          stepName: "Request Escalated",
          actor: "Current User (Mock)",
          action: "escalated",
          timestamp: new Date().toISOString(),
          comment: `Request escalated at step: ${selectedRequest.currentStepName}`,
        },
      ],
    };
    setSelectedRequest(updatedRequest);
    setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
    toast({ title: "Request Escalated (Mock)", description: `Request ${selectedRequest.id} has been escalated.`});
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
          // Current step needs to account for whether it's truly the active step or if it's already approved
          const isCurrent = step.id === request.currentStepId && !isCompleted && 
                           (request.history.some(h => h.stepId === step.id && (h.action === "system_auto_proceed" || h.action === "submitted")) || currentStepIndex === index );
          
          let icon;
          let textClass = "text-muted-foreground";
          let roleClass = "text-muted-foreground";
          let lineClass = "bg-border";

          if (isCompleted) {
            icon = <CheckCircle className="w-5 h-5 text-primary" />;
            textClass = "text-primary";
            roleClass = "text-primary";
            lineClass = "bg-primary";
          } else if (isCurrent) {
            icon = <Clock className="w-5 h-5 text-accent animate-pulse" />; 
            textClass = "text-accent font-semibold";
            roleClass = "text-accent";
            lineClass = "bg-accent";
          } else { 
            icon = <Circle className="w-5 h-5 text-muted-foreground/50" />;
            textClass = "text-muted-foreground/70";
            roleClass = "text-muted-foreground/70";
          }
          
          const isInitialCurrentStep = isCurrent && index === 0 && request.history.every(h => h.stepId === step.id ? (h.action === "system_auto_proceed" || h.action === "submitted") : true);
          if(isInitialCurrentStep && !isCompleted) { // Only color line if it's truly the current step awaiting action
             lineClass = "bg-accent"; 
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
                    placeholder="e.g., Alice Smith" 
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
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status / Current Step</TableHead>
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
                      <TableCell>{format(new Date(item.submissionDate), "yyyy-MM-dd HH:mm")}</TableCell>
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
