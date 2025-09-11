// src/lib/constants.ts
export const USER_ROLES = ["admin", "spoc", "user"] as const;
export type UserRole = typeof USER_ROLES[number];

export const DEPARTMENTS = ["Production", "Maintenance", "Logistics", "Quality Assurance", "IT", "HR", "Finance", "R&D", "Safety & Environment", "Sales", "Facility Management", "SR Engineering", "Housekeeping", "Security"] as const;
export type Department = typeof DEPARTMENTS[number];

export const TEAMS_AND_TRIBES = ["R&D Core Team", "Elevator Systems", "Escalator Innovations", "Digital Services", "Field Support"] as const;
export type TeamOrTribe = typeof TEAMS_AND_TRIBES[number];

export const ASSET_CLASSIFICATIONS = ["IT Equipment", "Test Equipment", "Tools & Tackles", "Prototyping Equipment", "Furniture & Fixtures", "Vehicles", "Lab Equipment", "Machinery"] as const;
export type AssetClassification = typeof ASSET_CLASSIFICATIONS[number];

export const ASSET_GROUPINGS = ["Project Phoenix", "General IT Pool", "Elevator Test Kit A", "R&D Cost Center"] as const;
export type AssetGrouping = typeof ASSET_GROUPINGS[number];

export const ASSET_STATUSES = ["Active", "In Store", "In Use", "Reserved", "Calibration", "Under Maintenance", "Scrapped", "Verification Pending"] as const;
export type AssetStatus = typeof ASSET_STATUSES[number];

export const MOVEMENT_TYPES = ["TT <> ITEC", "ITEC -> Site", "Calibration", "Scrap"] as const;
export type MovementType = typeof MOVEMENT_TYPES[number];

export const REASON_CODES = ["New Project Allocation", "Temporary Loan", "Return after use", "Scheduled Calibration", "Breakdown Maintenance", "End of Life", "Disposal"] as const;
export type ReasonCode = typeof REASON_CODES[number];

export const LOCATIONS = ["TT", "ITEC", "Site", "Labs"] as const;
export type LocationType = typeof LOCATIONS[number];

export const REQUEST_TYPES = ["Material Movement", "Scrap Request", "Work Permit", "Purchase Order", "Sale Order", "Asset Request"] as const;
export type RequestType = typeof REQUEST_TYPES[number];

export const REQUEST_STATUSES = ["Pending", "Approved", "Rejected", "In Progress", "Completed", "Voided"] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];

export const MATERIAL_TYPES = ["Raw Material", "Consumables", "Finished Goods", "Spare Parts", "Chemicals"] as const;
export type MaterialType = typeof MATERIAL_TYPES[number];

export const ACTIVITY_TYPES_WORK_PERMIT = ["Hot Work", "Confined Space Entry", "Working at Height", "Electrical Work (LV/MV/HV)", "Civil Works (Excavation, Construction)", "Chemical Handling"] as const;
export type ActivityTypeWorkPermit = typeof ACTIVITY_TYPES_WORK_PERMIT[number];

export const SCRAP_TYPES = ["Metal Scrap (Ferrous)", "Metal Scrap (Non-Ferrous)", "Plastic Scrap", "E-waste", "Paper/Cardboard", "Chemical/Hazardous Waste"] as const;
export type ScrapType = typeof SCRAP_TYPES[number];

export const STORE_LOCATIONS = ["Central Warehouse Alpha", "Electronics Sub-Store", "Maintenance Store", "Scrap Yard", "Production Line A", "Production Line B", "Dispatch Area", "Quality Lab", "ITEC", "TT"] as const;
export type StoreLocation = typeof STORE_LOCATIONS[number];

export const COST_CENTERS = ["CC_RD_001_Electronics", "CC_RD_002_Mechanical", "CC_PROD_001_Assembly", "CC_MAINT_001", "CC_FIN_001"] as const;
export type CostCenter = typeof COST_CENTERS[number];

export const MOCK_VENDORS = [
  { id: "V001", name: "Tech Solutions Inc." },
  { id: "V002", name: "Industrial Supplies Co." },
  { id: "V003", name: "OfficeMart" },
  { id: "V004", name: "Consulting Experts Ltd." },
  { id: "V005", name: "Bulk Materials Inc." },
];


export type Quarter = "Q1 (Apr-Jun)" | "Q2 (Jul-Sep)" | "Q3 (Oct-Dec)" | "Q4 (Jan-Mar)" | "Full Year";
export const QUARTERS: Quarter[] = ["Q1 (Apr-Jun)", "Q2 (Jul-Sep)", "Q3 (Oct-Dec)", "Q4 (Jan-Mar)", "Full Year"];

export type FiscalYear = "2023-2024" | "2024-2025" | "2025-2026";
export const FISCAL_YEARS: FiscalYear[] = ["2023-2024", "2024-2025", "2025-2026"];

export interface DepartmentBudget {
    id: string;
    department: Department;
    year: FiscalYear;
    q1Budget: number;
    q2Budget: number;
    q3Budget: number;
    q4Budget: number;
}
export const MOCK_DEPARTMENT_BUDGETS: DepartmentBudget[] = [
    { id: "db1", department: "R&D", year: "2024-2025", q1Budget: 500000, q2Budget: 600000, q3Budget: 550000, q4Budget: 700000 },
    { id: "db2", department: "IT", year: "2024-2025", q1Budget: 1000000, q2Budget: 1200000, q3Budget: 1100000, q4Budget: 1500000 },
    { id: "db3", department: "Production", year: "2024-2025", q1Budget: 2000000, q2Budget: 2500000, q3Budget: 2200000, q4Budget: 2800000 },
    { id: "db4", department: "R&D", year: "2023-2024", q1Budget: 450000, q2Budget: 550000, q3Budget: 500000, q4Budget: 650000 },
];

export const MATERIAL_CATEGORIES = ["Raw Material", "Components", "Consumables", "Finished Goods", "Safety Equipment"] as const;
export type MaterialCategory = typeof MATERIAL_CATEGORIES[number];

export const LIFECYCLE_STAGES = ["Requested", "Approved", "Received", "In Use", "Returned", "Under Maintenance", "Scrap Pending", "Scrapped", "Closed"] as const;
export type LifecycleStage = typeof LIFECYCLE_STAGES[number];

export interface WorkflowStep {
  id: string;
  name: string;
  assignedRoles: UserRole[];
  nextStepId?: string;
  rejectionStepId?: string;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  requestType: RequestType;
  steps: WorkflowStep[];
}

export const MOCK_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "material_movement_default", name: "Default Material Movement", requestType: "Material Movement",
    steps: [
      { id: "mm_dept_head_approval", name: "Department Head Approval", assignedRoles: ["department_head", "admin"], nextStepId: "mm_dispatch_team_coordination" },
      { id: "mm_dispatch_team_coordination", name: "Dispatch Team Coordination", assignedRoles: ["dispatch_team", "admin"], nextStepId: "mm_finance_check" },
      { id: "mm_finance_check", name: "Finance Check (If Applicable)", assignedRoles: ["finance_team", "admin"], nextStepId: "mm_receipt_confirmation" },
      { id: "mm_receipt_confirmation", name: "Receipt Confirmation", assignedRoles: ["requester", "dispatch_team", "admin"] }
    ]
  },
   {
    id: "scrap_default", name: "Default Scrap Request", requestType: "Scrap Request",
    steps: [
      { id: "sm_dept_head_approval", name: "Department Head Approval", assignedRoles: ["department_head", "admin"], nextStepId: "sm_finance_approval" },
      { id: "sm_finance_approval", name: "Finance Approval", assignedRoles: ["finance_team", "admin"], nextStepId: "sm_mm_head_approval" },
      { id: "sm_mm_head_approval", name: "MM Head Approval", assignedRoles: ["mm_head", "admin"] }
    ]
  },
  {
    id: "work_permit_default", name: "Default Work Permit", requestType: "Work Permit",
    steps: [
      { id: "wp_safety_review", name: "Safety Team Review", assignedRoles: ["safety_team", "admin"], nextStepId: "wp_maintenance_review" },
      { id: "wp_maintenance_review", name: "Maintenance Team Review", assignedRoles: ["maintenance_team", "admin"], nextStepId: "wp_facility_head" },
      { id: "wp_facility_head", name: "Permit Issued by Facility Head", assignedRoles: ["facility_team", "department_head", "admin"] }
    ]
  },
  {
    id: "po_default", name: "Default Purchase Order", requestType: "Purchase Order",
    steps: [
      { id: "po_dept_head", name: "Dept. Head Approval", assignedRoles: ["department_head", "admin"], nextStepId: "po_finance" },
      { id: "po_finance", name: "Finance Approval (Budget)", assignedRoles: ["finance_team", "admin"], nextStepId: "po_sap_creation" },
      { id: "po_sap_creation", name: "SAP PO Creation & Update", assignedRoles: ["admin", "finance_team"], nextStepId: "po_fulfilled" },
      { id: "po_fulfilled", name: "PO Fulfilled", assignedRoles: [] }
    ]
  },
   {
    id: "so_default", name: "Default Sale Order", requestType: "Sale Order",
    steps: [
      { id: "so_manager_approval", name: "Sales Manager Approval", assignedRoles: ["department_head", "admin"], nextStepId: "so_finance_approval" },
      { id: "so_finance_approval", name: "Finance Approval", assignedRoles: ["finance_team", "admin"], nextStepId: "so_sap_creation" },
      { id: "so_sap_creation", name: "SAP SO Creation & Update", assignedRoles: ["admin", "finance_team"], nextStepId: "so_shipped" },
      { id: "so_shipped", name: "SO Shipped", assignedRoles: [] }
    ]
  },
  {
    id: "asset_request_default", name: "Default Asset Request", requestType: "Asset Request",
    steps: [
      { id: "admin_approval", name: "Admin Approval", assignedRoles: ["admin"], nextStepId: "request_closed" },
      { id: "request_closed", name: "Request Closed", assignedRoles: [] }
    ]
  }
];
