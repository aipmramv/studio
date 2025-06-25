// src/lib/mock-data.ts
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Truck, Recycle, ShieldCheck, ShoppingCart, Tags, Package, Hash, CheckCircle, Clock, Circle, X } from 'lucide-react';
import { DEPARTMENTS, MOCK_WORKFLOW_TEMPLATES, type RequestType, type UserAction, type UserRole, type WorkflowStep } from './constants';
import { type MaterialMovementFormData, type ScrapMovementFormData, type WorkPermitFormData, type PurchaseOrderFormData, type SaleOrderFormData } from './schemas';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

export type RequestPayload = MaterialMovementFormData | ScrapMovementFormData | WorkPermitFormData | PurchaseOrderFormData | SaleOrderFormData;

export interface ApprovalHistoryItem {
  stepId: string;
  stepName: string;
  action: UserAction | "submitted" | "commented" | "reminded" | "escalated" | "system_auto_proceed";
  actor: string;
  timestamp: string;
  comment?: string;
}

export interface ApprovalItem {
  id: string;
  requestType: RequestType;
  requesterName: string;
  requesterDepartment: typeof DEPARTMENTS[number] | "External" | "Sales" | "Facility Management";
  submissionDate: string; // ISO Date string
  currentStepId: string;
  currentStepName: string;
  currentAssignees: UserRole[]; // Roles assigned to the current step
  workflowTemplateId: string;
  payload: RequestPayload;
  history: ApprovalHistoryItem[];
  isVoided?: boolean;
  voidReason?: string;
}

export const allRequestsSource: ApprovalItem[] = [
  {
    id: "MM001", requestType: "Material Movement", requesterName: "Ram Kumar", requesterDepartment: "Production", submissionDate: "2024-07-28T10:00:00Z",
    currentStepId: "mm_receipt_confirmation", currentStepName: "Receipt Confirmation", currentAssignees: ["requester", "dispatch_team", "admin"], workflowTemplateId: "material_movement_default",
    payload: { materialType: "Raw Material", source: "Warehouse A", destination: "Production Line 1", quantity: 100, value: 150000, isReturnable: "no", vehicleNumber:"MH12AB1234" } as MaterialMovementFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Ram Kumar", action: "submitted", timestamp: "2024-07-28T10:00:00Z", comment: "Initial submission for urgent production requirement." },
      { stepId: "mm_dept_head_approval", stepName: "Department Head Approval", actor: "Prem Kumar", action: "approve", timestamp: "2024-07-28T11:00:00Z" },
      { stepId: "mm_dispatch_team_coordination", stepName: "Dispatch Team Coordination", actor: "Logistics Team", action: "approve", timestamp: "2024-07-28T12:00:00Z" },
      { stepId: "mm_finance_check", stepName: "Finance Check (If Applicable)", actor: "Chandrasekar R.", action: "approve", timestamp: "2024-07-28T13:00:00Z" },
      { stepId: "mm_receipt_confirmation", stepName: "Pending Receipt Confirmation", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-28T13:01:00Z" },
    ]
  },
  {
    id: "SM002", requestType: "Scrap Request", requesterName: "Praveen S.", requesterDepartment: "Maintenance", submissionDate: "2024-07-27T14:30:00Z",
    currentStepId: "sm_finance_approval", currentStepName: "Finance Approval", currentAssignees: ["finance_team", "admin"], workflowTemplateId: "scrap_default",
    payload: { scrapType: "E-waste", description: "Old monitors and keyboards, non-functional", quantity: 10, weight: 50, gatePassNumber: "GP7890" } as ScrapMovementFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Praveen S.", action: "submitted", timestamp: "2024-07-27T14:30:00Z" },
      { stepId: "sm_dept_head_approval", stepName: "Department Head Approval", actor: "Prem Kumar", action: "approve", timestamp: "2024-07-27T15:00:00Z", comment: "Looks OK." },
      { stepId: "sm_finance_approval", stepName: "Pending Finance Approval", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-27T15:01:00Z" },
    ]
  },
  {
    id: "WP003", requestType: "Work Permit", requesterName: "Chandrasekar R.", requesterDepartment: "IT", submissionDate: "2024-07-29T09:15:00Z",
    currentStepId: "wp_maintenance_review", currentStepName: "Maintenance Team Review", currentAssignees: ["maintenance_team", "admin"], workflowTemplateId: "work_permit_default",
    payload: { activityType: "Electrical Work (LV/MV/HV)", building: "KOSMO Building", activityDetails: "Routine server maintenance in DC room 3. Includes rack mounting and cable management.", specificAreaOrEquipment: "DC Room 3, Rack A5", permitValidity: new Date("2024-08-05") } as WorkPermitFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Chandrasekar R.", action: "submitted", timestamp: "2024-07-29T09:15:00Z" },
      { stepId: "wp_safety_review", stepName: "Safety Team Review", actor: "Sashikanth M.", action: "approve", timestamp: "2024-07-29T14:00:00Z", comment: "Safety protocols confirmed." },
      { stepId: "wp_maintenance_review", stepName: "Pending Maintenance Review", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-29T14:01:00Z"}
    ]
  },
  {
    id: "WP007", requestType: "Work Permit", requesterName: "Ram Kumar (Facility)", requesterDepartment: "Facility Management", submissionDate: "2024-08-02T10:00:00Z",
    currentStepId: "wp_facility_head", currentStepName: "Permit Issued by Facility Head", currentAssignees: ["facility_team", "department_head", "admin"], workflowTemplateId: "work_permit_default", // Assuming wp_facility_head is final.
    payload: { activityType: "Civil Works (Excavation, Construction)", building: "Test Tower", activityDetails: "Area preparation for new equipment installation, minor excavation.", specificAreaOrEquipment: "Test Tower, Ground Floor, Bay 3", permitValidity: new Date("2024-08-15") } as WorkPermitFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Ram Kumar (Facility)", action: "submitted", timestamp: "2024-08-02T10:00:00Z" },
      { stepId: "wp_safety_review", stepName: "Safety Team Review", actor: "Sashikanth M.", action: "approve", timestamp: "2024-08-02T14:00:00Z", comment: "All clear." },
      { stepId: "wp_maintenance_review", stepName: "Maintenance Team Review", actor: "Prem Kumar", action: "approve", timestamp: "2024-08-03T09:00:00Z", comment: "Impact assessed, OK to proceed."},
      { stepId: "wp_facility_head", stepName: "Permit Issued by Facility Head", actor: "Kumaravel P.", action: "approve", timestamp: "2024-08-03T11:00:00Z", comment: "Permit issued."},
    ]
  },
  {
    id: "PO004", requestType: "Purchase Order", requesterName: "Nagaraj V.", requesterDepartment: "Logistics", submissionDate: "2024-07-29T11:00:00Z",
    currentStepId: "po_dept_head", currentStepName: "Dept. Head Approval", currentAssignees: ["department_head", "admin"], workflowTemplateId: "po_default",
    payload: { poCategory: "IT Equipment", department: "IT", vendorName: "Tech Solutions Inc.", kmKmgCode: "KM123", costCenter: "CC_IT_001_Infra", ioNumber: "IO_IT_2024_004", poDate: new Date("2024-07-29"), items: [{itemName: "Laptop Model X", quantity: 5, unitPrice: 120000, hsnSacCode:"84713010", gstPercentage:18}, {itemName: "Docking Station", quantity: 5, unitPrice: 15000, hsnSacCode:"84718000", gstPercentage:18}], deliveryAddress: "Main Office, R&D Block", segment: "Hardware Refresh" } as PurchaseOrderFormData,
     history: [
      { stepId: "submission", stepName: "Submitted", actor: "Nagaraj V.", action: "submitted", timestamp: "2024-07-29T11:00:00Z" },
      { stepId: "po_dept_head", stepName: "Pending Dept. Head Approval", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-29T11:01:00Z"}
    ]
  },
   {
    id: "SO005", requestType: "Sale Order", requesterName: "Praveen S.", requesterDepartment: "Sales", submissionDate: "2024-07-30T11:00:00Z",
    currentStepId: "so_manager_approval", currentStepName: "Sales Manager Approval", currentAssignees: ["department_head", "admin"], workflowTemplateId: "so_default",
    payload: { customerName: "Client ABC Corp", soDate: new Date("2024-07-30"), projectOrCrNo:"PROJ123", saleOrderCategory:"Software", purpose:"Annual License Renewal", costCenter:"CC_SALES_001", ioNumber:"IO_SALES_2024_005", budgetAmount:500000, materialRequiredDate:new Date("2024-08-15"), departmentHeadApproval:"Sales Head", deliveryTo:"IT Dept Contact", items: [{itemName: "Software License - Annual", quantity: 10, unitPrice: 50000, hsnSacCode: "997331", gstPercentage: 18}], shippingAddress: "Client HQ, Tower B, Floor 5", billingAddress: "Client HQ, Accounts Dept." } as SaleOrderFormData,
     history: [
      { stepId: "submission", stepName: "Submitted", actor: "Praveen S.", action: "submitted", timestamp: "2024-07-30T11:00:00Z" },
      { stepId: "so_manager_approval", stepName: "Pending Sales Manager Approval", actor: "System", action: "system_auto_proceed", timestamp: "2024-07-30T11:01:00Z"}
    ]
  },
  {
    id: "MM006", requestType: "Material Movement", requesterName: "Chandrasekar R.", requesterDepartment: "Logistics", submissionDate: "2024-08-01T10:00:00Z",
    currentStepId: "mm_finance_check", currentStepName: "Finance Check (If Applicable)", currentAssignees: ["finance_team", "admin"], workflowTemplateId: "material_movement_default",
    payload: { materialType: "Finished Goods", source: "Main Warehouse", destination: "Shipping Dock", quantity: 50, value: 250000, isReturnable: "no", vehicleNumber:"MH14CD5678" } as MaterialMovementFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Chandrasekar R.", action: "submitted", timestamp: "2024-08-01T10:00:00Z" },
      { stepId: "mm_dept_head_approval", stepName: "Department Head Approval", actor: "Kumaravel P.", action: "approve", timestamp: "2024-08-01T11:30:00Z" },
      { stepId: "mm_dispatch_team_coordination", stepName: "Dispatch Team Coordination", actor: "Logistics Team", action: "approve", timestamp: "2024-08-01T11:30:30Z", comment: "Vehicle and manpower planned." },
      { stepId: "mm_finance_check", stepName: "Pending Finance Check", actor: "System", action: "system_auto_proceed", timestamp: "2024-08-01T11:31:00Z" },
    ]
  },
  {
    id: "PO008", requestType: "Purchase Order", requesterName: "Ram Kumar", requesterDepartment: "IT", submissionDate: "2024-08-01T14:00:00Z",
    currentStepId: "po_finance", currentStepName: "Finance Approval (Budget)", currentAssignees: ["finance_team", "admin"], workflowTemplateId: "po_default",
    payload: { poCategory: "Services", department: "IT", vendorName: "Consulting Experts Ltd.", costCenter: "CC_IT_002_Services", ioNumber: "IO_IT_2024_008", poDate: new Date("2024-08-01"), items: [{itemName: "Annual Software Support", quantity: 1, unitPrice: 250000, hsnSacCode:"998314", gstPercentage:18}], deliveryAddress: "N/A - Service Contract", segment: "Software Maintenance" } as PurchaseOrderFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Ram Kumar", action: "submitted", timestamp: "2024-08-01T14:00:00Z" },
      { stepId: "po_dept_head", stepName: "Dept. Head Approval", actor: "Sashikanth M.", action: "approve", timestamp: "2024-08-01T16:30:00Z" },
      { stepId: "po_finance", stepName: "Pending Finance Approval (Budget)", actor: "System", action: "system_auto_proceed", timestamp: "2024-08-01T16:31:00Z"}
    ]
  },
  {
    id: "PO009", requestType: "Purchase Order", requesterName: "Praveen S.", requesterDepartment: "Production", submissionDate: "2024-08-02T09:30:00Z",
    currentStepId: "po_sap_creation", currentStepName: "SAP PO Creation & Update", currentAssignees: ["admin", "finance_team"], workflowTemplateId: "po_default",
    payload: { poCategory: "Raw Materials", department: "Production", vendorName: "Bulk Materials Inc.", costCenter: "CC_MFG_001_Assembly", ioNumber: "IO_PROD_2024_009", poDate: new Date("2024-08-02"), items: [{itemName: "Special Grade Screws", quantity: 10000, unitPrice: 5, hsnSacCode:"73181500", gstPercentage:12}], deliveryAddress: "Production Warehouse", segment: "Assembly Line Supply" } as PurchaseOrderFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Praveen S.", action: "submitted", timestamp: "2024-08-02T09:30:00Z" },
      { stepId: "po_dept_head", stepName: "Dept. Head Approval", actor: "Kumaravel P.", action: "approve", timestamp: "2024-08-02T11:00:00Z" },
      { stepId: "po_finance", stepName: "Finance Approval (Budget)", actor: "Chandrasekar R.", action: "approve", timestamp: "2024-08-02T15:00:00Z" },
      { stepId: "po_sap_creation", stepName: "Pending SAP PO Creation", actor: "System", action: "system_auto_proceed", timestamp: "2024-08-02T15:01:00Z"}
    ]
  },
  {
    id: "PO010", requestType: "Purchase Order", requesterName: "Nagaraj V.", requesterDepartment: "Logistics", submissionDate: "2024-07-20T10:00:00Z",
    currentStepId: "request_voided_final", currentStepName: "Request Voided", currentAssignees: [], workflowTemplateId: "po_default", isVoided: true, voidReason: "Duplicate request.",
    payload: { poCategory: "Consumables", department: "Logistics", vendorName: "Packing Solutions", costCenter: "CC_LOG_001", ioNumber: "IO_LOG_2024_010", poDate: new Date("2024-07-20"), items: [{itemName: "Packing Tapes", quantity: 200, unitPrice: 50, hsnSacCode:"39191000", gstPercentage:18}], deliveryAddress: "Central Warehouse Alpha" } as PurchaseOrderFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Nagaraj V.", action: "submitted", timestamp: "2024-07-20T10:00:00Z" },
      { stepId: "po_dept_head", stepName: "Request Voided", actor: "Nagaraj V.", action: "system_auto_proceed", timestamp: "2024-07-20T11:00:00Z", comment: "Voided: Duplicate request."}
    ]
  },
];


export const getRequestTypeIcon = (requestType: RequestType, className?: string) => {
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

export const renderRequestSummary = (item: ApprovalItem): string => {
  const { requestType, payload } = item;
  const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };

  switch (requestType) {
    case "Material Movement":
      const mm = payload as MaterialMovementFormData;
      return `Move ${mm.quantity} x ${mm.materialType} from ${mm.source} to ${mm.destination}. Value: ${mm.value.toLocaleString('en-IN', currencyFormattingOptions)}`;
    case "Scrap Request":
      const sm = payload as ScrapMovementFormData;
      return `${sm.quantity} units of ${sm.scrapType} (${sm.weight} units weight). Desc: ${sm.description.substring(0,50)}... ${sm.gatePassNumber ? `GP: ${sm.gatePassNumber}` : ''}`;
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
      return `Vendor: ${po.vendorName}. ${po.items.length} item(s). Total: ${poTotal.toLocaleString('en-IN', currencyFormattingOptions)}`;
    case "Sale Order":
      const so = payload as SaleOrderFormData;
      const soTotal = so.items.reduce((sum, i) => {
        const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
        const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
        return sum + itemTotal + itemGst;
      }, 0);
      return `Customer: ${so.customerName}. ${so.items.length} item(s). Total: ${soTotal.toLocaleString('en-IN', currencyFormattingOptions)}`;
    default:
      return "Details not available.";
  }
};

export const renderRequestPayloadDetailsDialog = (payload: RequestPayload, requestType: RequestType): ReactNode[] => {
    const details: {key: string, value: string | number | undefined | React.ReactNode }[] = [];
    const currencyFormattingOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 };

    switch (requestType) {
      case "Material Movement":
        const mmPayload = payload as MaterialMovementFormData;
        details.push({ key: "Material Type", value: mmPayload.materialType });
        details.push({ key: "Source", value: mmPayload.source });
        details.push({ key: "Destination", value: mmPayload.destination });
        details.push({ key: "Quantity", value: mmPayload.quantity });
        details.push({ key: "Value", value: mmPayload.value.toLocaleString('en-IN', currencyFormattingOptions) });
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
        if(poPayload.sapOrderNumber) details.push({ key: "SAP PO Number", value: <span className='font-bold text-primary'>{poPayload.sapOrderNumber}</span> });
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
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price (INR)</TableHead><TableHead>HSN/SAC</TableHead><TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Total (INR)</TableHead></TableRow></TableHeader>
            <TableBody>
            {poPayload.items.map((item, idx) => {
              const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
              const itemGst = itemTotal * ((item.gstPercentage || 0) / 100);
              const lineTotal = itemTotal + itemGst;
              return (
              <TableRow key={idx}><TableCell>{item.itemName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{item.unitPrice.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell><TableCell>{item.hsnSacCode || 'N/A'}</TableCell><TableCell className="text-right">{item.gstPercentage ? `${item.gstPercentage}%` : 'N/A'}</TableCell><TableCell className="text-right">{lineTotal.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell></TableRow>
              );
            })}
            </TableBody>
             <TableFooter><TableRow><TableCell colSpan={5} className="text-right font-bold">Grand Total (INR)</TableCell><TableCell className="text-right font-bold">{poPayload.items.reduce((sum, i) => {
                const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
                const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
                return sum + itemTotal + itemGst;
             }, 0).toLocaleString('en-IN', currencyFormattingOptions)}</TableCell></TableRow></TableFooter>
          </Table>
        )});
        if(poPayload.remarks) details.push({ key: "Remarks", value: <p className="whitespace-pre-wrap">{poPayload.remarks}</p> });
        break;
      case "Sale Order":
        const soPayload = payload as SaleOrderFormData;
        if(soPayload.sapOrderNumber) details.push({ key: "SAP SO Number", value: <span className='font-bold text-primary'>{soPayload.sapOrderNumber}</span> });
        details.push({ key: "Customer", value: soPayload.customerName });
        details.push({ key: "SO Date", value: new Date(soPayload.soDate).toLocaleDateString() });
        details.push({ key: "Project/CR No.", value: soPayload.projectOrCrNo });
        details.push({ key: "SO Category", value: soPayload.saleOrderCategory });
        details.push({ key: "Purpose", value: <p className="whitespace-pre-wrap">{soPayload.purpose}</p> });
        details.push({ key: "Cost Center", value: soPayload.costCenter });
        details.push({ key: "IO Number", value: soPayload.ioNumber });
        details.push({ key: "Budget Amount", value: soPayload.budgetAmount.toLocaleString('en-IN', currencyFormattingOptions) });
        details.push({ key: "Material Req. Date", value: new Date(soPayload.materialRequiredDate).toLocaleDateString() });
        details.push({ key: "Dept. Head Approval", value: soPayload.departmentHeadApproval });
        details.push({ key: "Delivery To", value: soPayload.deliveryTo });
         details.push({ key: "Items", value: (
            <Table className="mt-2 text-xs">
            <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead className="text-right">Price (INR)</TableHead><TableHead>HSN/SAC</TableHead><TableHead className="text-right">GST%</TableHead><TableHead className="text-right">Total (INR)</TableHead></TableRow></TableHeader>
            <TableBody>
            {soPayload.items.map((item, idx) => {
              const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
              const itemGst = itemTotal * ((item.gstPercentage || 0) / 100);
              const lineTotal = itemTotal + itemGst;
              return(
              <TableRow key={idx}><TableCell>{item.itemName}</TableCell><TableCell>{item.quantity}</TableCell><TableCell className="text-right">{item.unitPrice.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell><TableCell>{item.hsnSacCode || 'N/A'}</TableCell><TableCell className="text-right">{item.gstPercentage ? `${item.gstPercentage}%` : 'N/A'}</TableCell><TableCell className="text-right">{lineTotal.toLocaleString('en-IN', currencyFormattingOptions)}</TableCell></TableRow>
              );
            })}
            </TableBody>
            <TableFooter><TableRow><TableCell colSpan={5} className="text-right font-bold">Grand Total (INR)</TableCell><TableCell className="text-right font-bold">{soPayload.items.reduce((sum, i) => {
                const itemTotal = (i.quantity || 0) * (i.unitPrice || 0);
                const itemGst = itemTotal * ((i.gstPercentage || 0) / 100);
                return sum + itemTotal + itemGst;
            }, 0).toLocaleString('en-IN', currencyFormattingOptions)}</TableCell></TableRow></TableFooter>
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

export const renderWorkflowProgress = (request: ApprovalItem): ReactNode => {
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
          const isVoidedOrRejected = request.currentStepName === "Request Voided" || request.currentStepName === "Request Rejected";


          let icon;
          let textClass = "text-muted-foreground/80";
          let roleClass = "text-muted-foreground/80";
          let lineClass = "bg-border";

          if (isVoidedOrRejected && step.id === request.currentStepId) {
             icon = <X className="w-5 h-5 text-destructive" />;
             textClass = "text-destructive font-semibold";
             roleClass = "text-destructive";
             lineClass = "bg-destructive";
          } else if (isCompleted) {
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
          if(isInitialCurrentStep && !isCompleted && !isVoidedOrRejected) {
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
