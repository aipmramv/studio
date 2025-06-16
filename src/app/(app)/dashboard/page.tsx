
// src/app/(app)/dashboard/page.tsx
"use client";
import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, User, CalendarDays, Filter, LayoutGrid, List, Briefcase, Package, ShieldCheck, ShoppingCart, Tags, Recycle, Edit3, DollarSign, Truck, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { type RequestType, type UserRole, DEPARTMENTS, MOCK_WORKFLOW_TEMPLATES, USER_ACTIONS, type UserAction } from "@/lib/constants";
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
} from "@/components/ui/table";

type RequestPayload = MaterialMovementFormData | ScrapMovementFormData | WorkPermitFormData | PurchaseOrderFormData | SaleOrderFormData;

interface ApprovalHistoryItem {
  stepId: string;
  stepName: string;
  action: UserAction | "submitted" | "system_auto_proceed";
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
    id: "MM001", requestType: "Material Movement", requesterName: "Alice Smith", requesterDepartment: "Production", submissionDate: "2024-07-28T10:00:00Z",
    currentStepId: "mm_dept_head", currentStepName: "Department Head Approval", currentAssignees: ["department_head", "admin"], workflowTemplateId: "material_movement_default",
    payload: { materialType: "Raw Material", source: "Warehouse A", destination: "Production Line 1", quantity: 100, value: 150000, isReturnable: "no", vehicleNumber:"MH12AB1234" } as MaterialMovementFormData,
    history: [{ stepId: "submission", stepName:"Submitted", actor: "Alice Smith", action: "submitted", timestamp: "2024-07-28T10:00:00Z" }]
  },
  {
    id: "SM002", requestType: "Scrap Request", requesterName: "Bob Johnson", requesterDepartment: "Maintenance", submissionDate: "2024-07-27T14:30:00Z",
    currentStepId: "sm_finance_clearance", currentStepName: "Finance Clearance", currentAssignees: ["finance_team", "admin"], workflowTemplateId: "scrap_default", 
    payload: { scrapType: "E-waste", description: "Old monitors and keyboards", quantity: 10, weight: 50 } as ScrapMovementFormData,
    history: [{ stepId: "submission", stepName:"Submitted", actor: "Bob Johnson", action: "submitted", timestamp: "2024-07-27T14:30:00Z" }]
  },
  {
    id: "WP003", requestType: "Work Permit", requesterName: "Carol White", requesterDepartment: "IT", submissionDate: "2024-07-29T09:15:00Z",
    currentStepId: "wp_safety_review", currentStepName: "Safety Team Review", currentAssignees: ["safety", "admin"], workflowTemplateId: "work_permit_default",
    payload: { building: "KOSMO", activityType: "Electrical Work (LV/MV/HV)", activityDetails: "Routine server maintenance in DC room 3", specificAreaOrEquipment: "DC Room 3", permitValidity: new Date() } as WorkPermitFormData,
    history: [{ stepId: "submission", stepName:"Submitted", actor: "Carol White", action: "submitted", timestamp: "2024-07-29T09:15:00Z" }]
  },
  {
    id: "PO004", requestType: "Purchase Order", requesterName: "David Brown", requesterDepartment: "Logistics", submissionDate: "2024-07-29T11:00:00Z",
    currentStepId: "po_dept_head", currentStepName: "Dept. Head Approval", currentAssignees: ["department_head", "admin"], workflowTemplateId: "po_default",
    payload: { vendorName: "Tech Solutions Inc.", poDate: new Date("2024-07-29"), items: [{itemName: "Laptop Model X", quantity: 5, unitPrice: 120000, hsnSacCode:"84713010", gstPercentage:18}], deliveryAddress: "Main Office", poCategory:"IT Equipment", department:"IT", costCenter:"IT001", ioNumber:"IO_IT004" } as PurchaseOrderFormData,
    history: [{ stepId: "submission", stepName:"Submitted", actor: "David Brown", action: "submitted", timestamp: "2024-07-29T11:00:00Z"}]
  },
];

export default function ApprovalsDashboardPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = React.useState<ApprovalItem[]>(mockApprovalsData);
  const [viewMode, setViewMode] = React.useState<'card' | 'grid'>('card');
  const { toast } = useToast();

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(ApprovalSchema),
    defaultValues: { comment: "" },
  });

  const userVisibleApprovals = React.useMemo(() => {
    if (!user) return [];
    if(user.role === 'admin') return approvals; // Admin sees all
    return approvals.filter(item => 
      item.currentAssignees.includes(user.role) || // Directly assigned
      (item.currentAssignees.includes('department_head') && user.department && item.requesterDepartment === user.department) // Department head logic (example)
    );
  }, [approvals, user]);

  const handleApprovalAction = (itemId: string, action: UserAction, comment?: string) => {
    const item = approvals.find(ap => ap.id === itemId);
    if (!item) return;

    console.log(`Item ${itemId} ${action}ed with comment: ${comment} by ${user?.displayName}`);
    
    setApprovals(prev => prev.filter(ap => ap.id !== itemId)); 
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

  const renderRequestPayloadSummary = (item: ApprovalItem): string => {
    const { requestType, payload } = item;
    const formattingOptions: Intl.NumberFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  
    switch (requestType) {
      case "Material Movement":
        const mm = payload as MaterialMovementFormData;
        return `Move ${mm.quantity} x ${mm.materialType} from ${mm.source} to ${mm.destination}. Value: ${mm.value.toLocaleString('en-IN', formattingOptions)}`;
      case "Scrap Request":
        const sm = payload as ScrapMovementFormData;
        return `Dispose ${sm.quantity} units of ${sm.scrapType} (${sm.weight} units weight).`;
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
  
  const getRequestTypeIcon = (requestType: RequestType) => {
    switch (requestType) {
      case "Material Movement": return <Truck className="w-5 h-5 mr-2 text-primary" />;
      case "Scrap Request": return <Recycle className="w-5 h-5 mr-2 text-primary" />;
      case "Work Permit": return <ShieldCheck className="w-5 h-5 mr-2 text-primary" />;
      case "Purchase Order": return <ShoppingCart className="w-5 h-5 mr-2 text-primary" />;
      case "Sale Order": return <Tags className="w-5 h-5 mr-2 text-primary" />;
      default: return <Package className="w-5 h-5 mr-2 text-primary" />;
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
              {userVisibleApprovals.map((item) => (
                <Card key={item.id} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                       <div className="flex items-center">
                        {getRequestTypeIcon(item.requestType)}
                        <CardTitle className="text-xl font-headline">{item.requestType}</CardTitle>
                       </div>
                      <Badge variant="secondary" className="capitalize">
                        {item.currentStepName.toLowerCase()}
                      </Badge>
                    </div>
                    <CardDescription>Request ID: {item.id}</CardDescription>
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
            <Card className="shadow-lg">
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
                        <TableCell className="font-medium">{item.id}</TableCell>
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
    </div>
  );
}
