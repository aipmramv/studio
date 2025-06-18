
export const USER_ROLES = ["requester", "approver", "admin", "safety", "mm_team", "department_head", "finance_team", "dispatch_team", "maintenance_team", "facility_team"] as const;
export type UserRole = typeof USER_ROLES[number];

export const MATERIAL_TYPES = ["Raw Material", "Scrap", "Tool", "Finished Goods", "Consumable", "Component", "Spare Part"] as const;
export type MaterialType = typeof MATERIAL_TYPES[number];

export const MATERIAL_CATEGORIES = ["Raw Material", "Components", "Consumables", "Finished Goods", "Spare Parts", "Safety Equipment", "Tools & Tackles", "Office Supplies", "Chemicals"] as const;
export type MaterialCategory = typeof MATERIAL_CATEGORIES[number];


export const SCRAP_TYPES = ["Plastic", "E-waste", "Metal Ferrous", "Metal Non-Ferrous", "Paper", "Wood", "Chemical", "Other"] as const;
export type ScrapType = typeof SCRAP_TYPES[number];

export const STORE_LOCATIONS = [
  "Central Warehouse Alpha",
  "Electronics Sub-Store",
  "Maintenance Store",
  "Dispatch Area",
  "Production Line Store 1",
  "Quality Lab Store",
  "Receiving Bay",
  "KOSMO Building",
  "Test Tower",
  "Admin Block",
  "Warehouse B",
  "Production Hall X",
  "Utility Building",
  "Main Gate",
  "Scrap Yard"
] as const;
export type StoreLocationType = typeof STORE_LOCATIONS[number];

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

export const REQUEST_STATUSES = ["Pending", "Approved", "Rejected", "In Progress", "Completed", "Cancelled"] as const;
export type RequestStatus = typeof REQUEST_STATUSES[number];


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
      { id: "mm_dept_head", name: "Department Head Approval", assignedRoles: ["department_head", "admin"], nextStepId: "mm_finance_check" },
      { id: "mm_finance_check", name: "Finance Check (If Value > X)", assignedRoles: ["finance_team", "admin"], nextStepId: "mm_dispatch_approval", rejectionLeadsToStepId: "mm_dept_head" },
      { id: "mm_dispatch_approval", name: "Dispatch Team Approval", assignedRoles: ["dispatch_team", "admin"] },
    ],
  },
  {
    id: "work_permit_default",
    requestType: "Work Permit",
    name: "Standard Work Permit Workflow",
    initialStepId: "wp_safety_review",
    steps: [
      { id: "wp_safety_review", name: "Safety Team Review", assignedRoles: ["safety", "admin"], nextStepId: "wp_maintenance_review", rejectionLeadsToStepId: "wp_safety_review"},
      { id: "wp_maintenance_review", name: "Maintenance Team Review", assignedRoles: ["maintenance_team", "admin"], nextStepId: "wp_facility_head", rejectionLeadsToStepId: "wp_safety_review" },
      { id: "wp_facility_head", name: "Facility Head Approval", assignedRoles: ["facility_team", "department_head", "admin"] },
    ],
  },
  {
    id: "po_default",
    requestType: "Purchase Order",
    name: "Standard Purchase Order Workflow",
    initialStepId: "po_dept_head",
    steps: [
      { id: "po_dept_head", name: "Dept. Head Approval", assignedRoles: ["department_head", "admin"], nextStepId: "po_finance", rejectionLeadsToStepId: "po_dept_head" },
      { id: "po_finance", name: "Finance Approval", assignedRoles: ["finance_team", "admin"] },
    ]
  },
  {
    id: "scrap_default",
    requestType: "Scrap Request",
    name: "Standard Scrap Disposal Workflow",
    initialStepId: "sm_supervisor_approval",
    steps: [
      { id: "sm_supervisor_approval", name: "Supervisor Approval", assignedRoles: ["department_head", "admin"], nextStepId: "sm_ehs_clearance", rejectionLeadsToStepId: "sm_supervisor_approval" },
      { id: "sm_ehs_clearance", name: "EHS Clearance", assignedRoles: ["safety", "admin"], nextStepId: "sm_gate_pass", rejectionLeadsToStepId: "sm_supervisor_approval" },
      { id: "sm_gate_pass", name: "Gate Pass Issue", assignedRoles: ["dispatch_team", "admin"] },
    ],
  },
  {
    id: "so_default",
    requestType: "Sale Order",
    name: "Standard Sale Order Workflow",
    initialStepId: "so_manager_approval",
    steps: [
      { id: "so_manager_approval", name: "Sales Manager Approval", assignedRoles: ["department_head", "admin"], nextStepId: "so_finance_review", rejectionLeadsToStepId: "so_manager_approval" },
      { id: "so_finance_review", name: "Finance Review", assignedRoles: ["finance_team", "admin"], nextStepId: "so_dispatch_prep", rejectionLeadsToStepId: "so_manager_approval" },
      { id: "so_dispatch_prep", name: "Dispatch Preparation", assignedRoles: ["dispatch_team", "admin"] },
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
export type CostCenterType = typeof COST_CENTERS[number];

export const MOCK_VENDORS = [
  { id: "VEND001", name: "Tech Solutions Inc.", contactPerson: "Mr. Sharma", email: "sales@techsolutions.com", phone: "9876543210", category: "IT Equipment" },
  { id: "VEND002", name: "Industrial Supplies Co.", contactPerson: "Ms. Priya", email: "info@industrialsupplies.co", phone: "8765432109", category: "Raw Materials" },
  { id: "VEND003", name: "Office Essentials Ltd.", contactPerson: "Mr. Kumar", email: "support@officeessentials.com", phone: "7654321098", category: "Stationery" },
] as const;
export type MockVendor = typeof MOCK_VENDORS[number];

export const MOCK_CUSTOMERS = [
  { id: "CUST001", name: "Global Corp", contactPerson: "Ms. Lee", email: "procurement@globalcorp.com", phone: "1234567890", industry: "Manufacturing" },
  { id: "CUST002", name: "Innovate Labs", contactPerson: "Dr. Singh", email: "purchasing@innovatelabs.org", phone: "2345678901", industry: "Research" },
  { id: "CUST003", name: "Local Services Ltd.", contactPerson: "Mr. Patel", email: "accounts@localservices.net", phone: "3456789012", industry: "Services" },
] as const;
export type MockCustomer = typeof MOCK_CUSTOMERS[number];

export const MOCK_HSN_SAC_CODES = [
  { id: "HSN001", code: "84713010", description: "Laptops, personal computers", type: "HSN" },
  { id: "HSN002", code: "84718000", description: "Other units of ADP machines", type: "HSN" },
  { id: "SAC001", code: "997331", description: "Licensing services for the right to use computer software", type: "SAC" },
  { id: "SAC002", code: "998313", description: "Management consulting and management services", type: "SAC" },
] as const;
export type MockHsnSacCode = typeof MOCK_HSN_SAC_CODES[number];

export const MOCK_UNITS_OF_MEASUREMENT = [
  { id: "UOM001", name: "Pieces", abbreviation: "PCS" },
  { id: "UOM002", name: "Kilograms", abbreviation: "KG" },
  { id: "UOM003", name: "Liters", abbreviation: "LTR" },
  { id: "UOM004", name: "Units", abbreviation: "UNT" },
  { id: "UOM005", name: "Meters", abbreviation: "MTR" },
  { id: "UOM006", name: "Kits", abbreviation: "KIT" },
  { id: "UOM007", name: "Packs", abbreviation: "PAK" },
] as const;
export type MockUom = typeof MOCK_UNITS_OF_MEASUREMENT[number];

export const FISCAL_YEARS = ["2023-2024", "2024-2025", "2025-2026"] as const;
export type FiscalYear = typeof FISCAL_YEARS[number];

export const QUARTERS = ["Q1 (Apr-Jun)", "Q2 (Jul-Sep)", "Q3 (Oct-Dec)", "Q4 (Jan-Mar)", "Full Year"] as const;
export type Quarter = typeof QUARTERS[number];

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
  { id: "DB001", department: "R&D", year: "2024-2025", q1Budget: 500000, q2Budget: 550000, q3Budget: 480000, q4Budget: 600000 },
  { id: "DB002", department: "IT", year: "2024-2025", q1Budget: 200000, q2Budget: 220000, q3Budget: 190000, q4Budget: 250000 },
  { id: "DB003", department: "Maintenance", year: "2024-2025", q1Budget: 150000, q2Budget: 160000, q3Budget: 140000, q4Budget: 180000 },
  { id: "DB004", department: "Production", year: "2024-2025", q1Budget: 1000000, q2Budget: 1100000, q3Budget: 950000, q4Budget: 1200000 },
  { id: "DB005", department: "R&D", year: "2023-2024", q1Budget: 450000, q2Budget: 500000, q3Budget: 430000, q4Budget: 550000 },
  { id: "DB006", department: "Finance", year: "2024-2025", q1Budget: 100000, q2Budget: 100000, q3Budget: 100000, q4Budget: 100000 },
  { id: "DB007", department: "Sales", year: "2024-2025", q1Budget: 300000, q2Budget: 320000, q3Budget: 280000, q4Budget: 350000 },
];

export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
export type FiscalMonthName = typeof MONTHS_SHORT[number];

interface UserExpenditure {
  userId: string;
  userName: string;
  actualAmount: number;
}

export interface MonthlyBudgetRecord {
  id: string;
  department: Department;
  year: FiscalYear;
  monthIndex: number;
  forecastedAmount: number;
  actualAmount: number;
  userBreakdown?: UserExpenditure[];
}

export const getFiscalMonthName = (monthIndex: number): string => {
  const fiscalYearMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  return fiscalYearMonths[monthIndex] || "Invalid Month";
};


export const MOCK_MONTHLY_BUDGET_DATA: MonthlyBudgetRecord[] = [
  {
    id: "MB001", department: "R&D", year: "2024-2025", monthIndex: 0, forecastedAmount: 160000, actualAmount: 155000, // Apr
    userBreakdown: [
      { userId: "user1", userName: "Alice Admin", actualAmount: 75000 },
      { userId: "user2", userName: "Bob Approver", actualAmount: 50000 },
      { userId: "user3", userName: "Charlie Requester", actualAmount: 30000 },
    ]
  },
  {
    id: "MB002", department: "R&D", year: "2024-2025", monthIndex: 1, forecastedAmount: 170000, actualAmount: 175000, // May
    userBreakdown: [
      { userId: "user1", userName: "Alice Admin", actualAmount: 80000 },
      { userId: "user3", userName: "Charlie Requester", actualAmount: 95000 },
    ]
  },
  { id: "MB003", department: "R&D", year: "2024-2025", monthIndex: 2, forecastedAmount: 170000, actualAmount: 165000 }, // Jun (Q1 total: 500k) - No user breakdown for this one
  {
    id: "MB004", department: "R&D", year: "2024-2025", monthIndex: 3, forecastedAmount: 180000, actualAmount: 182000, // Jul
     userBreakdown: [
      { userId: "user2", userName: "Bob Approver", actualAmount: 100000 },
      { userId: "user4", userName: "David DRE", actualAmount: 82000 },
    ]
  },
  { id: "MB005", department: "R&D", year: "2024-2025", monthIndex: 4, forecastedAmount: 180000, actualAmount: 0 },    // Aug (No actuals yet)
  { id: "MB006", department: "R&D", year: "2024-2025", monthIndex: 5, forecastedAmount: 190000, actualAmount: 0 },    // Sep (No actuals yet, Q2 total: 550k)

  {
    id: "MB007", department: "IT", year: "2024-2025", monthIndex: 0, forecastedAmount: 60000, actualAmount: 58000,  // Apr
    userBreakdown: [
      { userId: "it_user1", userName: "IT Support L1", actualAmount: 30000 },
      { userId: "it_user2", userName: "IT Infra Head", actualAmount: 28000 },
    ]
  },
  { id: "MB008", department: "IT", year: "2024-2025", monthIndex: 1, forecastedAmount: 70000, actualAmount: 72000 },  // May
  { id: "MB009", department: "IT", year: "2024-2025", monthIndex: 2, forecastedAmount: 70000, actualAmount: 65000 },  // Jun (Q1 total: 200k)

  { id: "MB010", department: "Finance", year: "2024-2025", monthIndex: 0, forecastedAmount: 30000, actualAmount: 28000 }, // Apr
  {
    id: "MB011", department: "Finance", year: "2024-2025", monthIndex: 1, forecastedAmount: 35000, actualAmount: 33000, // May
    userBreakdown: [
      { userId: "fin_user1", userName: "Finance Exec", actualAmount: 33000 },
    ]
  },
  { id: "MB012", department: "Finance", year: "2024-2025", monthIndex: 2, forecastedAmount: 35000, actualAmount: 38000 }, // Jun (Q1 total: 100k)

  // R&D 2023-2024 (Past year example)
  {
    id: "MB013", department: "R&D", year: "2023-2024", monthIndex: 0, forecastedAmount: 150000, actualAmount: 145000, // Apr
    userBreakdown: [
      { userId: "user1_old", userName: "Old Alice", actualAmount: 70000 },
      { userId: "user2_old", userName: "Old Bob", actualAmount: 75000 },
    ]
  },
  { id: "MB014", department: "R&D", year: "2023-2024", monthIndex: 1, forecastedAmount: 150000, actualAmount: 152000 }, // May
  { id: "MB015", department: "R&D", year: "2023-2024", monthIndex: 2, forecastedAmount: 150000, actualAmount: 148000 }, // Jun
  { id: "MB016", department: "R&D", year: "2023-2024", monthIndex: 3, forecastedAmount: 160000, actualAmount: 158000 }, // Jul
  { id: "MB017", department: "R&D", year: "2023-2024", monthIndex: 4, forecastedAmount: 170000, actualAmount: 171000 }, // Aug
  { id: "MB018", department: "R&D", year: "2023-2024", monthIndex: 5, forecastedAmount: 170000, actualAmount: 169000 }, // Sep
  { id: "MB019", department: "R&D", year: "2023-2024", monthIndex: 6, forecastedAmount: 140000, actualAmount: 138000 }, // Oct
  { id: "MB020", department: "R&D", year: "2023-2024", monthIndex: 7, forecastedAmount: 140000, actualAmount: 142000 }, // Nov
  { id: "MB021", department: "R&D", year: "2023-2024", monthIndex: 8, forecastedAmount: 150000, actualAmount: 149000 }, // Dec
  { id: "MB022", department: "R&D", year: "2023-2024", monthIndex: 9, forecastedAmount: 180000, actualAmount: 178000 }, // Jan
  { id: "MB023", department: "R&D", year: "2023-2024", monthIndex: 10, forecastedAmount: 180000, actualAmount: 181000 }, // Feb
  { id: "MB024", department: "R&D", year: "2023-2024", monthIndex: 11, forecastedAmount: 190000, actualAmount: 188000 }, // Mar
];


// --- New Constants for Reports ---

export interface RequestStatusSummaryItem {
  requestType: RequestType;
  totalSubmitted: number;
  pending: number;
  approved: number;
  rejected: number;
  inProgress?: number; // Optional, for workflows with multiple steps
  completed?: number; // Optional, for fully finished workflows
}

export const MOCK_REQUEST_STATUS_SUMMARY: RequestStatusSummaryItem[] = [
  { requestType: "Material Movement", totalSubmitted: 50, pending: 5, approved: 40, rejected: 3, inProgress: 2 },
  { requestType: "Scrap Request", totalSubmitted: 20, pending: 2, approved: 15, rejected: 1, completed: 2 },
  { requestType: "Work Permit", totalSubmitted: 30, pending: 8, approved: 20, rejected: 2 },
  { requestType: "Purchase Order", totalSubmitted: 15, pending: 3, approved: 10, rejected: 0, completed: 2 },
  { requestType: "Sale Order", totalSubmitted: 10, pending: 1, approved: 8, rejected: 1 },
];

export interface MaterialConsumptionItem {
  materialId: string;
  materialName: string;
  materialCategory: MaterialCategory;
  quantityIssued: number;
  unitOfMeasure: string;
  dateIssued: string; // ISO Date string
  issuedToDepartment: Department;
  issuingStore: StoreLocationType;
}

export const MOCK_MATERIAL_CONSUMPTION: MaterialConsumptionItem[] = [
  { materialId: "MAT001", materialName: "Steel Rods - 10mm", materialCategory: "Raw Material", quantityIssued: 50, unitOfMeasure: "Pieces", dateIssued: "2024-07-01T10:00:00Z", issuedToDepartment: "Production", issuingStore: "Central Warehouse Alpha" },
  { materialId: "MAT002", materialName: "Circuit Board XB-2", materialCategory: "Components", quantityIssued: 10, unitOfMeasure: "Units", dateIssued: "2024-07-02T11:00:00Z", issuedToDepartment: "R&D", issuingStore: "Electronics Sub-Store" },
  { materialId: "MAT003", materialName: "Lubricant Oil Grade 5", materialCategory: "Consumables", quantityIssued: 2, unitOfMeasure: "Liters", dateIssued: "2024-07-03T09:30:00Z", issuedToDepartment: "Maintenance", issuingStore: "Maintenance Store" },
  { materialId: "MAT001", materialName: "Steel Rods - 10mm", materialCategory: "Raw Material", quantityIssued: 30, unitOfMeasure: "Pieces", dateIssued: "2024-07-05T14:00:00Z", issuedToDepartment: "Production", issuingStore: "Central Warehouse Alpha" },
  { materialId: "MAT006", materialName: "Copper Wiring - 2.5mm", materialCategory: "Raw Material", quantityIssued: 100, unitOfMeasure: "Meters", dateIssued: "2024-07-08T16:00:00Z", issuedToDepartment: "Facility Management", issuingStore: "Electronics Sub-Store" },
];
