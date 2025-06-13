export const USER_ROLES = ["requester", "approver", "admin", "safety", "mm_team"] as const;
export type UserRole = typeof USER_ROLES[number];

export const MATERIAL_TYPES = ["Raw Material", "Scrap", "Tool", "Finished Goods", "Consumable"] as const;
export type MaterialType = typeof MATERIAL_TYPES[number];

export const SCRAP_TYPES = ["Plastic", "E-waste", "Metal Ferrous", "Metal Non-Ferrous", "Paper", "Wood", "Chemical", "Other"] as const;
export type ScrapType = typeof SCRAP_TYPES[number];

export const BUILDING_TYPES = ["KOSMO", "Test Tower", "Admin Block", "Warehouse A", "Warehouse B"] as const;
export type BuildingType = typeof BUILDING_TYPES[number];

export const APPROVAL_STATUSES = ["Pending", "Approved", "Rejected", "Pending Department Head", "Pending Dispatch", "Pending Finance", "Pending Safety", "Pending Maintenance Head", "Dispatched to ISU"] as const;
export type ApprovalStatus = typeof APPROVAL_STATUSES[number];

export const DEPARTMENTS = ["Production", "Maintenance", "Logistics", "Quality Assurance", "IT", "HR", "Finance"] as const;
export type Department = typeof DEPARTMENTS[number];

export const ACTIVITY_TYPES_WORK_PERMIT = ["Hot Work", "Confined Space Entry", "Working at Height", "Electrical Work", "Excavation", "General Maintenance"] as const;
export type ActivityTypeWorkPermit = typeof ACTIVITY_TYPES_WORK_PERMIT[number];
