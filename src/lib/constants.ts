
export const USER_ROLES = ["requester", "approver", "admin", "safety", "mm_team", "department_head", "finance_team", "dispatch_team", "maintenance_team", "facility_team"] as const;
export type UserRole = typeof USER_ROLES[number];

export const MATERIAL_TYPES = ["Raw Material", "Scrap", "Tool", "Finished Goods", "Consumable", "Component", "Spare Part"] as const;
export type MaterialType = typeof MATERIAL_TYPES[number];

export const MATERIAL_CATEGORIES = ["Raw Material", "Components", "Consumables", "Finished Goods", "Spare Parts", "Safety Equipment", "Tools & Tackles", "Office Supplies", "Chemicals"] as const;
export type MaterialCategory = typeof MATERIAL_CATEGORIES[number];


export const SCRAP_TYPES = ["Plastic", "E-waste", "Metal Ferrous", "Metal Non-Ferrous", "Paper", "Wood", "Chemical", "Other"] as const;
export type ScrapType = typeof SCRAP_TYPES[number];

export const BUILDING_TYPES = ["KOSMO", "Test Tower", "Admin Block", "Warehouse A", "Warehouse B", "Production Hall X", "Utility Building", "Main Gate", "Scrap Yard"] as const;
export type BuildingType = typeof BUILDING_TYPES[number];

export const STORE_LOCATIONS = ["Central Warehouse Alpha", "Electronics Sub-Store", "Maintenance Store", "Dispatch Area", "Production Line Store 1", "Quality Lab Store", "Receiving Bay"] as const;
export type StoreLocation = typeof STORE_LOCATIONS[number];

export const DEPARTMENTS = ["Production", "Maintenance", "Logistics", "Quality Assurance", "IT", "HR", "Finance", "R&D", "Safety & Environment", "Sales", "Facility Management"] as const;
export type Department = typeof DEPARTMENTS[number];


export const ACTIVITY_TYPES_WORK_PERMIT = [
  "Civil Works (Excavation, Construction)", 
  "Electrical Work (LV/MV/HV)", 
  "Equipment Installation/Modification", 
  "Equipment Maintenance/Repair",
  "Safety-Critical System Testing",
  "Hot Work (Welding, Grinding)", 
  "Confined Space Entry", 
  "Working at Height",
  "Chemical Handling",
  "General Maintenance/Inspection",
  "Software Update/System Change",
  "Network Cabling/Modification"
] as const;
export type ActivityTypeWorkPermit = typeof ACTIVITY_TYPES_WORK_PERMIT[number];


export const REQUEST_TYPES = ["Purchase Order", "Sale Order", "Material Movement", "Work Permit", "Scrap Request"] as const;
export type RequestType = typeof REQUEST_TYPES[number];

export interface WorkflowStep {
  id: string; 
  name: string; 
  assignedRoles: UserRole[]; 
  nextStepId?: string; 
  rejectionLeadsToStepId?: string; 
}

export interface WorkflowTemplate {
  id: string; 
  requestType: RequestType;
  name: string; 
  steps: WorkflowStep[];
  initialStepId: string;
}


export const MOCK_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "material_movement_default",
    requestType: "Material Movement",
    name: "Standard Material Movement Workflow",
    initialStepId: "mm_dept_head",
    steps: [
      { id: "mm_dept_head", name: "Department Head Approval", assignedRoles: ["department_head"], nextStepId: "mm_finance_check" },
      { id: "mm_finance_check", name: "Finance Check (High Value)", assignedRoles: ["finance_team"], nextStepId: "mm_dispatch_approval" },
      { id: "mm_dispatch_approval", name: "Dispatch Team Approval", assignedRoles: ["dispatch_team"] },
    ],
  },
  {
    id: "work_permit_default", 
    requestType: "Work Permit",
    name: "Standard Work Permit Workflow",
    initialStepId: "wp_safety_review",
    steps: [
      { id: "wp_safety_review", name: "Safety Team Review", assignedRoles: ["safety"], nextStepId: "wp_maintenance_review" },
      { id: "wp_maintenance_review", name: "Maintenance Team Review", assignedRoles: ["maintenance_team"], nextStepId: "wp_facility_head" },
      { id: "wp_facility_head", name: "Facility Head Approval", assignedRoles: ["facility_team", "department_head"] },
    ],
  },
  {
    id: "po_default",
    requestType: "Purchase Order",
    name: "Standard Purchase Order Workflow",
    initialStepId: "po_dept_head",
    steps: [
      { id: "po_dept_head", name: "Dept. Head Approval", assignedRoles: ["department_head"], nextStepId: "po_finance" },
      { id: "po_finance", name: "Finance Approval", assignedRoles: ["finance_team"] },
    ]
  },
  {
    id: "scrap_default",
    requestType: "Scrap Request",
    name: "Standard Scrap Disposal Workflow",
    initialStepId: "sm_supervisor_approval",
    steps: [
      { id: "sm_supervisor_approval", name: "Supervisor Approval", assignedRoles: ["department_head"], nextStepId: "sm_ehs_clearance" },
      { id: "sm_ehs_clearance", name: "EHS Clearance", assignedRoles: ["safety"], nextStepId: "sm_gate_pass" },
      { id: "sm_gate_pass", name: "Gate Pass Issue", assignedRoles: ["dispatch_team"] },
    ],
  },
  {
    id: "so_default",
    requestType: "Sale Order",
    name: "Standard Sale Order Workflow",
    initialStepId: "so_manager_approval",
    steps: [
      { id: "so_manager_approval", name: "Sales Manager Approval", assignedRoles: ["department_head"], nextStepId: "so_finance_review" },
      { id: "so_finance_review", name: "Finance Review", assignedRoles: ["finance_team"], nextStepId: "so_dispatch_prep" },
      { id: "so_dispatch_prep", name: "Dispatch Preparation", assignedRoles: ["dispatch_team"] },
    ],
  }
];

export const USER_ACTIONS = ["approve", "reject"] as const;
export type UserAction = typeof USER_ACTIONS[number];

export const COST_CENTERS = [
  "CC_RD_001_Electronics",
  "CC_RD_002_Mechanical",
  "CC_MFG_001_Assembly",
  "CC_MFG_002_Testing",
  "CC_ADMIN_001_HR",
  "CC_ADMIN_002_Finance",
  "CC_IT_001_Infra",
  "CC_MAINT_001_General"
] as const;
export type CostCenter = typeof COST_CENTERS[number];
