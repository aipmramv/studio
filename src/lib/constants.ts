// src/lib/constants.ts
export const USER_ROLES = ["admin", "spoc", "user"] as const;
export type UserRole = typeof USER_ROLES[number];

export const DEPARTMENTS = ["Production", "Maintenance", "Logistics", "Quality Assurance", "IT", "HR", "Finance", "R&D", "Safety & Environment", "Sales", "Facility Management", "SR Engineering", "Housekeeping", "Security"] as const;
export type Department = typeof DEPARTMENTS[number];

export const TEAMS_AND_TRIBES = ["R&D Core Team", "Elevator Systems", "Escalator Innovations", "Digital Services", "Field Support"] as const;
export type TeamOrTribe = typeof TEAMS_AND_TRIBES[number];

export const ASSET_CLASSIFICATIONS = ["IT Equipment", "Test Equipment", "Tools & Tackles", "Prototyping Equipment", "Furniture & Fixtures", "Vehicles", "Lab Equipment", "Machinery"] as const;
export type AssetClassification = typeof ASSET_CLASSIFICATIONS[number];

export const ASSET_STATUSES = ["Active", "In Store", "In Use", "Reserved", "Calibration", "Under Maintenance", "Scrapped", "Verification Pending"] as const;
export type AssetStatus = typeof ASSET_STATUSES[number];

export const MOVEMENT_TYPES = ["TT <> ITEC", "ITEC -> Site", "Calibration", "Scrap"] as const;
export type MovementType = typeof MOVEMENT_TYPES[number];

export const REASON_CODES = ["New Project Allocation", "Temporary Loan", "Return after use", "Scheduled Calibration", "Breakdown Maintenance", "End of Life", "Disposal"] as const;
export type ReasonCode = typeof REASON_CODES[number];

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

export const STORE_LOCATIONS = ["Central Warehouse Alpha", "Electronics Sub-Store", "Maintenance Store", "Scrap Yard", "Production Line A", "Production Line B", "Dispatch Area", "Quality Lab", "ITEC-Floor 1", "TT-Floor 2"] as const;
export type StoreLocation = typeof STORE_LOCATIONS[number];

export const COST_CENTERS = ["CC_RD_001_Electronics", "CC_RD_002_Mechanical", "CC_PROD_001_Assembly", "CC_MAINT_001", "CC_FIN_001"] as const;
export type CostCenter = typeof COST_CENTERS[number];


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
