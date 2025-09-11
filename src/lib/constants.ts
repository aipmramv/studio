
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
