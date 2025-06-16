
export const USER_ROLES = ["requester", "approver", "admin", "safety", "mm_team", "department_head", "finance_team", "dispatch_team"] as const;
export type UserRole = typeof USER_ROLES[number];

export const MATERIAL_TYPES = ["Raw Material", "Scrap", "Tool", "Finished Goods", "Consumable"] as const;
export type MaterialType = typeof MATERIAL_TYPES[number];

export const SCRAP_TYPES = ["Plastic", "E-waste", "Metal Ferrous", "Metal Non-Ferrous", "Paper", "Wood", "Chemical", "Other"] as const;
export type ScrapType = typeof SCRAP_TYPES[number];

export const BUILDING_TYPES = ["KOSMO", "Test Tower", "Admin Block", "Warehouse A", "Warehouse B"] as const;
export type BuildingType = typeof BUILDING_TYPES[number];

export const DEPARTMENTS = ["Production", "Maintenance", "Logistics", "Quality Assurance", "IT", "HR", "Finance"] as const;
export type Department = typeof DEPARTMENTS[number];

export const ACTIVITY_TYPES_WORK_PERMIT = ["Hot Work", "Confined Space Entry", "Working at Height", "Electrical Work", "Excavation", "General Maintenance"] as const;
export type ActivityTypeWorkPermit = typeof ACTIVITY_TYPES_WORK_PERMIT[number];

export const CURRENCIES = ["INR", "EUR"] as const;
export type Currency = typeof CURRENCIES[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: "₹",
  EUR: "€",
};

export const REQUEST_TYPES = ["Purchase Order", "Sale Order", "Material Movement", "Work Permit", "Scrap Request"] as const;
export type RequestType = typeof REQUEST_TYPES[number];

export interface WorkflowStep {
  id: string; // Unique ID for this step within the template (e.g., "dept_head_approval")
  name: string; // Display name (e.g., "Department Head Approval")
  assignedRoles: UserRole[]; // Roles that can action this step
  // For simplicity, we'll assume sequential. More complex logic (parallel, conditional) would expand this.
  nextStepId?: string; // ID of the next step if approved. Undefined if this is the last approval step.
  rejectionLeadsToStepId?: string; // Optional: step to go to if rejected (e.g., back to requester or a rework step)
}

export interface WorkflowTemplate {
  id: string; // Unique ID for the template (e.g., "material_movement_default")
  requestType: RequestType;
  name: string; // Display name (e.g., "Default Material Movement Workflow")
  steps: WorkflowStep[];
  initialStepId: string;
}

// Mock Workflow Templates (These would be stored in Firestore in a real app)
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
      { id: "wp_safety_review", name: "Safety Team Review", assignedRoles: ["safety"], nextStepId: "wp_facility_head" },
      { id: "wp_facility_head", name: "Facility Head Approval", assignedRoles: ["department_head"] },
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
    name: "Standard Scrap Request Workflow",
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

