// src/lib/mock-data.ts
import { DEPARTMENTS, type RequestType } from './constants';
import { type MaterialMovementFormData, type ScrapMovementFormData, type WorkPermitFormData, type PurchaseOrderFormData, type SaleOrderFormData } from './schemas';

export type RequestPayload = MaterialMovementFormData | ScrapMovementFormData | WorkPermitFormData | PurchaseOrderFormData | SaleOrderFormData;

export interface ApprovalHistoryItem {
  stepId: string;
  stepName: string;
  action: "approve" | "reject" | "submitted" | "commented" | "reminded" | "escalated" | "system_auto_proceed";
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
  currentAssignees: string[]; // Roles assigned to the current step
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
    id: "WP007", requestType: "Work Permit", requesterName: "Ram Kumar", requesterDepartment: "Facility Management", submissionDate: "2024-08-02T10:00:00Z",
    currentStepId: "wp_facility_head", currentStepName: "Permit Issued by Facility Head", currentAssignees: ["facility_team", "department_head", "admin"], workflowTemplateId: "work_permit_default",
    payload: { activityType: "Civil Works (Excavation, Construction)", building: "Test Tower", activityDetails: "Area preparation for new equipment installation, minor excavation.", specificAreaOrEquipment: "Test Tower, Ground Floor, Bay 3", permitValidity: new Date("2024-08-15") } as WorkPermitFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Ram Kumar", action: "submitted", timestamp: "2024-08-02T10:00:00Z" },
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
    payload: { poCategory: "Services", department: "IT", vendorName: "Consulting Experts Ltd.", costCenter: "CC_IT_002_Services", ioNumber: "IO_IT_2024_008", poDate: new Date("2024-08-01"), items: [{itemName: "Annual Software Support", quantity: 1, unitPrice: 250000, hsnSacCode:"998314", gstPercentage:18}], deliveryAddress: "N/A - Service Contract", segment: "Software Maintenance", sapOrderNumber: "" } as PurchaseOrderFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Ram Kumar", action: "submitted", timestamp: "2024-08-01T14:00:00Z" },
      { stepId: "po_dept_head", stepName: "Dept. Head Approval", actor: "Sashikanth M.", action: "approve", timestamp: "2024-08-01T16:30:00Z" },
      { stepId: "po_finance", stepName: "Pending Finance Approval (Budget)", actor: "System", action: "system_auto_proceed", timestamp: "2024-08-01T16:31:00Z"}
    ]
  },
  {
    id: "PO009", requestType: "Purchase Order", requesterName: "Praveen S.", requesterDepartment: "Production", submissionDate: "2024-08-02T09:30:00Z",
    currentStepId: "po_sap_creation", currentStepName: "SAP PO Creation & Update", currentAssignees: ["admin", "finance_team"], workflowTemplateId: "po_default",
    payload: { poCategory: "Raw Materials", department: "Production", vendorName: "Bulk Materials Inc.", costCenter: "CC_MFG_001_Assembly", ioNumber: "IO_PROD_2024_009", poDate: new Date("2024-08-02"), items: [{itemName: "Special Grade Screws", quantity: 10000, unitPrice: 5, hsnSacCode:"73181500", gstPercentage:12}], deliveryAddress: "Production Warehouse", segment: "Assembly Line Supply", sapOrderNumber: "" } as PurchaseOrderFormData,
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
    payload: { poCategory: "Consumables", department: "Logistics", vendorName: "Packing Solutions", costCenter: "CC_LOG_001", ioNumber: "IO_LOG_2024_010", poDate: new Date("2024-07-20"), items: [{itemName: "Packing Tapes", quantity: 200, unitPrice: 50, hsnSacCode:"39191000", gstPercentage:18}], deliveryAddress: "Central Warehouse Alpha", sapOrderNumber: "" } as PurchaseOrderFormData,
    history: [
      { stepId: "submission", stepName: "Submitted", actor: "Nagaraj V.", action: "submitted", timestamp: "2024-07-20T10:00:00Z" },
      { stepId: "po_dept_head", stepName: "Request Voided", actor: "Nagaraj V.", action: "system_auto_proceed", timestamp: "2024-07-20T11:00:00Z", comment: "Voided: Duplicate request."}
    ]
  },
];
