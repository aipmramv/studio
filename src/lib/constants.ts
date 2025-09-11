
// src/lib/constants.ts
export const USER_ROLES = ["admin", "spoc", "user"] as const;
export type UserRole = typeof USER_ROLES[number];

export const DEPARTMENTS = ["Production", "Maintenance", "Logistics", "Quality Assurance", "IT", "HR", "Finance", "R&D", "Safety & Environment", "Sales", "Facility Management", "SR Engineering", "Housekeeping", "Security"] as const;
export type Department = typeof DEPARTMENTS[number];

export const TEAMS_AND_TRIBES = ["R&D Core Team", "Elevator Systems", "Escalator Innovations", "Digital Services", "Field Support"] as const;
export type TeamOrTribe = typeof TEAMS_AND_TRIBES[number];

export const ASSET_CLASSIFICATIONS = ["IT Equipment", "Test Equipment", "Tools & Tackles", "Prototyping Equipment", "Furniture & Fixtures", "Vehicles"] as const;
export type AssetClassification = typeof ASSET_CLASSIFICATIONS[number];

export const ASSET_STATUSES = ["Active", "In Store", "In Use", "Reserved", "Calibration", "Under Maintenance", "Scrapped", "Verification Pending"] as const;
export type AssetStatus = typeof ASSET_STATUSES[number];

export const MOVEMENT_TYPES = ["TT <> ITEC", "ITEC -> Site", "Calibration", "Scrap"] as const;
export type MovementType = typeof MOVEMENT_TYPES[number];

export const LOCATIONS = ["TT", "ITEC", "Site", "Labs"] as const;
export type LocationType = typeof LOCATIONS[number];

export const REQUEST_TYPES = ["Material Movement", "Scrap Request", "Work Permit", "Purchase Order", "Sale Order"] as const;
export type RequestType = typeof REQUEST_TYPES[number];

export const REQUEST_STATUSES = ["Pending", "Approved", "Rejected", "In Progress", "Completed", "Voided"] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];

export const MATERIAL_TYPES = ["Raw Material", "Consumables", "Finished Goods", "Spare Parts", "Chemicals"] as const;
export type MaterialType = typeof MATERIAL_TYPES[number];

export const ACTIVITY_TYPES_WORK_PERMIT = ["Hot Work", "Confined Space Entry", "Working at Height", "Electrical Work (LV/MV/HV)", "Civil Works (Excavation, Construction)", "Chemical Handling"] as const;
export type ActivityTypeWorkPermit = typeof ACTIVITY_TYPES_WORK_PERMIT[number];

export const SCRAP_TYPES = ["Metal Scrap (Ferrous)", "Metal Scrap (Non-Ferrous)", "Plastic Scrap", "E-waste", "Paper/Cardboard", "Chemical/Hazardous Waste"] as const;
export type ScrapType = typeof SCRAP_TYPES[number];

export const STORE_LOCATIONS = ["Central Warehouse Alpha", "Electronics Sub-Store", "Maintenance Store", "Scrap Yard", "Production Line A", "Production Line B", "Dispatch Area", "Quality Lab"] as const;
export type StoreLocation = typeof STORE_LOCATIONS[number];

export const COST_CENTERS = ["CC_RD_001_Electronics", "CC_RD_002_Mechanical", "CC_PROD_001_Assembly", "CC_MAINT_001", "CC_FIN_001"] as const;
export type CostCenter = typeof COST_CENTERS[number];

export const MOCK_CUSTOMERS = [
  { id: "CUST001", name: "Global Corp", contactPerson: "Ms. Lee", email: "procurement@globalcorp.com", phone: "1234567890", industry: "Manufacturing" },
  { id: "CUST002", name: "Innovate Labs", contactPerson: "Mr. Singh", email: "singh@innovatelabs.net", phone: "0987654321", industry: "Research" },
  { id: "CUST003", name: "BuildRight Construction", contactPerson: "Mr. Chen", email: "chen@buildright.com", phone: "5551234567", industry: "Construction" }
];
export type Customer = typeof MOCK_CUSTOMERS[number];

export const MOCK_VENDORS = [
  { id: "VEND001", name: "Tech Solutions Inc.", contactPerson: "Mr. Sharma", email: "sales@techsol.com", phone: "9876543210", category: "IT Equipment" },
  { id: "VEND002", name: "Industrial Supplies Co.", contactPerson: "Ms. Gupta", email: "contact@industrialsupplies.co", phone: "8765432109", category: "Raw Materials" },
  { id: "VEND003", name: "Safety Gear Direct", contactPerson: "Mr. Patel", email: "info@safetygeardirect.com", phone: "7654321098", category: "Safety Equipment" }
];
export type Vendor = typeof MOCK_VENDORS[number];

export const MOCK_UNITS_OF_MEASUREMENT = [
  { id: "uom1", name: "Pieces", abbreviation: "PCS" },
  { id: "uom2", name: "Kilograms", abbreviation: "KG" },
  { id: "uom3", name: "Liters", abbreviation: "Ltr" },
  { id: "uom4", name: "Meters", abbreviation: "M" },
  { id: "uom5", name: "Units", abbreviation: "Units" },
  { id: "uom6", name: "Packs", abbreviation: "Packs" },
  { id: "uom7", name: "Boxes", abbreviation: "BOX" },
  { id: "uom8", name: "Tons", abbreviation: "Tons" },
];
export type Uom = typeof MOCK_UNITS_OF_MEASUREMENT[number];

export const MOCK_HSN_SAC_CODES = [
    { id: "hsn1", code: "84713010", description: "Laptops, personal computers", type: "HSN" as const },
    { id: "hsn2", code: "998314", description: "IT software support services", type: "SAC" as const },
    { id: "hsn3", code: "73181500", description: "Screws, bolts, nuts of iron or steel", type: "HSN" as const },
    { id: "hsn4", code: "997331", description: "Rental services of machinery", type: "SAC" as const },
];
export type HsnSacCode = typeof MOCK_HSN_SAC_CODES[number];

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

export interface RequestStatusSummaryItem {
    requestType: RequestType;
    totalSubmitted: number;
    pending: number;
    approved: number;
    rejected: number;
    inProgress?: number;
    completed?: number;
}
export const MOCK_REQUEST_STATUS_SUMMARY: RequestStatusSummaryItem[] = [
    { requestType: "Material Movement", totalSubmitted: 15, pending: 2, approved: 8, rejected: 1, inProgress: 2, completed: 2 },
    { requestType: "Scrap Request", totalSubmitted: 8, pending: 1, approved: 4, rejected: 2, completed: 1 },
    { requestType: "Work Permit", totalSubmitted: 12, pending: 3, approved: 7, rejected: 1, completed: 1 },
    { requestType: "Purchase Order", totalSubmitted: 20, pending: 5, approved: 10, rejected: 2, completed: 3 },
    { requestType: "Sale Order", totalSubmitted: 10, pending: 2, approved: 6, rejected: 1, completed: 1 },
];

export interface WorkflowStep {
  id: string;
  name: string;
  assignedRoles: UserRole[];
  nextStepId?: string; // On approval
  rejectionLeadsToStepId?: string; // On rejection, if not specified, it reverts to requester or ends
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  requestType: RequestType;
  initialStepId: string;
  steps: WorkflowStep[];
}

export const MOCK_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
      id: "material_movement_default", name: "Standard Material Movement", requestType: "Material Movement",
      initialStepId: "mm_dept_head_approval",
      steps: [
        { id: "mm_dept_head_approval", name: "Department Head Approval", assignedRoles: ["spoc", "admin"], nextStepId: "mm_dispatch_team_coordination" },
        { id: "mm_dispatch_team_coordination", name: "Dispatch Team Coordination", assignedRoles: ["logistics_team", "admin"], nextStepId: "mm_finance_check" },
        { id: "mm_finance_check", name: "Finance Check (If Applicable)", assignedRoles: ["finance_team", "admin"], nextStepId: "mm_receipt_confirmation" },
        { id: "mm_receipt_confirmation", name: "Receipt Confirmation", assignedRoles: ["requester", "dispatch_team", "admin"] }
      ],
    },
    {
        id: "scrap_default", name: "Standard Scrap Disposal", requestType: "Scrap Request",
        initialStepId: "sm_dept_head_approval",
        steps: [
            { id: "sm_dept_head_approval", name: "Department Head Approval", assignedRoles: ["spoc", "admin"], nextStepId: "sm_finance_approval" },
            { id: "sm_finance_approval", name: "Finance Approval", assignedRoles: ["finance_team", "admin"], nextStepId: "sm_mm_head_dispatch" },
            { id: "sm_mm_head_dispatch", name: "MM Head Approval & Dispatch", assignedRoles: ["logistics_team", "admin"] },
        ],
    },
    {
        id: "work_permit_default", name: "Standard Work Permit", requestType: "Work Permit",
        initialStepId: "wp_safety_review",
        steps: [
            { id: "wp_safety_review", name: "Safety Team Review", assignedRoles: ["safety_team", "admin"], nextStepId: "wp_maintenance_review" },
            { id: "wp_maintenance_review", name: "Maintenance Team Review", assignedRoles: ["maintenance_team", "admin"], nextStepId: "wp_facility_head" },
            { id: "wp_facility_head", name: "Permit Issued by Facility Head", assignedRoles: ["facility_team", "department_head", "admin"] },
        ],
    },
     {
        id: "po_default", name: "Standard Purchase Order", requestType: "Purchase Order",
        initialStepId: "po_dept_head",
        steps: [
            { id: "po_dept_head", name: "Dept. Head Approval", assignedRoles: ["spoc", "admin"], nextStepId: "po_finance" },
            { id: "po_finance", name: "Finance Approval (Budget)", assignedRoles: ["finance_team", "admin"], nextStepId: "po_sap_creation" },
            { id: "po_sap_creation", name: "SAP PO Creation & Update", assignedRoles: ["admin", "finance_team"] },
        ],
    },
    {
        id: "so_default", name: "Standard Sale Order", requestType: "Sale Order",
        initialStepId: "so_manager_approval",
        steps: [
            { id: "so_manager_approval", name: "Sales Manager Approval", assignedRoles: ["department_head", "admin"], nextStepId: "so_finance_approval" },
            { id: "so_finance_approval", name: "Finance Approval (Credit)", assignedRoles: ["finance_team", "admin"], nextStepId: "so_sap_creation" },
            { id: "so_sap_creation", name: "SAP SO Creation & Update", assignedRoles: ["admin", "finance_team"] },
        ],
    },
];

export interface WorkPermitCustomField {
    id: string;
    label: string;
    type: "text" | "number" | "checkbox" | "date";
    isRequired: boolean;
}

export interface WorkPermitTemplate {
    id: string;
    name: string;
    customFields: WorkPermitCustomField[];
}

export const MOCK_STANDARD_PERMIT_SECTIONS = [
    { id: "sps_01", name: "Job Description", description: "Details of the work to be carried out." },
    { id: "sps_02", name: "Hazard Identification", description: "Checklist of potential hazards (e.g., electrical, chemical)." },
    { id: "sps_03", name: "Safety Precautions", description: "Checklist of safety measures (e.g., PPE, LOTO)." },
    { id: "sps_04", name: "Gas Test Readings", description: "Required for confined space entry permits." },
    { id: "sps_05", name: "Authorization & Acceptance", description: "Signatures from issuing and receiving authorities." },
    { id: "sps_06", name: "Permit Closeout", description: "Signatures confirming work completion and area safety." }
];

export const MOCK_WORK_PERMIT_TEMPLATES: WorkPermitTemplate[] = [
    {
        id: "wpt_general",
        name: "General Work Permit",
        customFields: [
            { id: "gwp_cf_01", label: "Specific Tools Required", type: "text", isRequired: true },
            { id: "gwp_cf_02", label: "Number of personnel", type: "number", isRequired: true },
        ]
    },
    {
        id: "wpt_hot_work",
        name: "Hot Work Permit",
        customFields: [
            { id: "hwp_cf_01", label: "Fire Extinguisher Present", type: "checkbox", isRequired: true },
            { id: "hwp_cf_02", label: "Fire Watch Assigned", type: "text", isRequired: true },
            { id: "hwp_cf_03", label: "Combustibles Cleared (Meters)", type: "number", isRequired: true },
        ]
    },
    {
        id: "wpt_confined_space",
        name: "Confined Space Entry Permit",
        customFields: [
            { id: "csep_cf_01", label: "Atmosphere Test Results (O2, LEL)", type: "text", isRequired: true },
            { id: "csep_cf_02", label: "Rescue Plan in Place", type: "checkbox", isRequired: true },
        ]
    }
];

export const WORK_PERMIT_FIELD_TYPES: WorkPermitCustomField['type'][] = ["text", "number", "checkbox", "date"];
