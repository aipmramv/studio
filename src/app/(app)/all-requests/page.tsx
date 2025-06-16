
// src/app/(app)/all-requests/page.tsx
"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Truck, Recycle, ShieldCheck, ShoppingCart, Tags, Package } from "lucide-react";
import { type RequestType, type Currency, CURRENCY_SYMBOLS } from "@/lib/constants";
import { type MaterialMovementFormData, type ScrapMovementFormData, type WorkPermitFormData, type PurchaseOrderFormData, type SaleOrderFormData } from "@/lib/schemas";

type RequestPayload = MaterialMovementFormData | ScrapMovementFormData | WorkPermitFormData | PurchaseOrderFormData | SaleOrderFormData;

interface ApprovalItem {
  id: string;
  requestType: RequestType;
  requesterName: string;
  requesterDepartment: string;
  submissionDate: string;
  currentStepId: string;
  currentStepName: string;
  payload: RequestPayload;
}

// Using a slightly expanded version of mockApprovalsData from dashboard for variety
const mockAllRequestsData: ApprovalItem[] = [
  {
    id: "MM001", requestType: "Material Movement", requesterName: "Alice Smith", requesterDepartment: "Production", submissionDate: "2024-07-28T10:00:00Z",
    currentStepId: "mm_dept_head", currentStepName: "Department Head Approval",
    payload: { materialType: "Raw Material", source: "Warehouse A", destination: "Production Line 1", quantity: 100, currency: "INR", value: 150000, isReturnable: "no", vehicleNumber:"MH12AB1234" } as MaterialMovementFormData,
  },
  {
    id: "SM002", requestType: "Scrap Request", requesterName: "Bob Johnson", requesterDepartment: "Maintenance", submissionDate: "2024-07-27T14:30:00Z",
    currentStepId: "sm_finance_clearance", currentStepName: "Finance Clearance",
    payload: { scrapType: "E-waste", description: "Old monitors and keyboards", quantity: 10, weight: 50 } as ScrapMovementFormData,
  },
  {
    id: "WP003", requestType: "Work Permit", requesterName: "Carol White", requesterDepartment: "IT", submissionDate: "2024-07-29T09:15:00Z",
    currentStepId: "wp_safety_review", currentStepName: "Safety Team Review",
    payload: { building: "KOSMO", activityType: "Server Maintenance", activityDetails: "Routine server maintenance in DC room 3" } as WorkPermitFormData,
  },
  {
    id: "PO004", requestType: "Purchase Order", requesterName: "David Brown", requesterDepartment: "Logistics", submissionDate: "2024-07-29T11:00:00Z",
    currentStepId: "po_dept_head", currentStepName: "Dept. Head Approval", 
    payload: { vendorName: "Tech Solutions Inc.", poDate: new Date("2024-07-29"), currency: "EUR", items: [{itemName: "Laptop Model X", quantity: 5, unitPrice: 1200}], deliveryAddress: "Main Office", paymentTerms: "Net 30" } as PurchaseOrderFormData,
  },
   {
    id: "SO005", requestType: "Sale Order", requesterName: "Eve Green", requesterDepartment: "Sales", submissionDate: "2024-07-30T11:00:00Z",
    currentStepId: "so_manager_approval", currentStepName: "Sales Manager Approval", 
    payload: { customerName: "Client ABC Corp", soDate: new Date("2024-07-30"), currency: "INR", items: [{itemName: "Software License", quantity: 10, unitPrice: 5000}], shippingAddress: "Client HQ", billingAddress: "Client HQ" } as SaleOrderFormData,
  },
   {
    id: "MM006", requestType: "Material Movement", requesterName: "Frank Black", requesterDepartment: "Stores", submissionDate: "2024-07-30T15:00:00Z",
    currentStepId: "mm_dispatch_approval", currentStepName: "Dispatch Team Approval",
    payload: { materialType: "Finished Goods", source: "Assembly Line Z", destination: "Shipping Dock", quantity: 250, currency: "INR", value: 750000, isReturnable: "no" } as MaterialMovementFormData,
  },
];


const getRequestTypeIcon = (requestType: RequestType) => {
  switch (requestType) {
    case "Material Movement": return <Truck className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Scrap Request": return <Recycle className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Work Permit": return <ShieldCheck className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Purchase Order": return <ShoppingCart className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "Sale Order": return <Tags className="w-4 h-4 mr-2 text-muted-foreground" />;
    default: return <Package className="w-4 h-4 mr-2 text-muted-foreground" />;
  }
};

const renderRequestSummary = (item: ApprovalItem): string => {
  const { requestType, payload } = item;
  switch (requestType) {
    case "Material Movement":
      const mm = payload as MaterialMovementFormData;
      return `${mm.quantity} x ${mm.materialType} from ${mm.source} to ${mm.destination}. Value: ${CURRENCY_SYMBOLS[mm.currency as Currency]}${mm.value.toLocaleString()}`;
    case "Scrap Request":
      const sm = payload as ScrapMovementFormData;
      return `${sm.quantity} units of ${sm.scrapType} (${sm.weight} units weight). Desc: ${sm.description.substring(0,50)}...`;
    case "Work Permit":
      const wp = payload as WorkPermitFormData;
      return `For ${wp.activityType} in ${wp.building}. Details: ${wp.activityDetails.substring(0,50)}...`;
    case "Purchase Order":
      const po = payload as PurchaseOrderFormData;
      const poTotal = po.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
      return `Vendor: ${po.vendorName}. ${po.items.length} item(s). Total: ${CURRENCY_SYMBOLS[po.currency as Currency]}${poTotal.toLocaleString()}`;
    case "Sale Order":
      const so = payload as SaleOrderFormData;
      const soTotal = so.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
      return `Customer: ${so.customerName}. ${so.items.length} item(s). Total: ${CURRENCY_SYMBOLS[so.currency as Currency]}${soTotal.toLocaleString()}`;
    default:
      return "Details not available.";
  }
};

export default function AllRequestsPage() {
  const [requests, setRequests] = React.useState<ApprovalItem[]>(mockAllRequestsData);

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
            This table shows all types of requests. Future enhancements could include filtering and sorting.
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
                      <Button variant="ghost" size="icon" title="View Details (Not Implemented)" disabled>
                        <Eye className="w-4 h-4" />
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
    </div>
  );
}

