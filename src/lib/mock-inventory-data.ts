// src/lib/mock-inventory-data.ts
import { MATERIAL_CATEGORIES, STORE_LOCATIONS, DEPARTMENTS } from "./constants";
import { MaterialIssueItem, MaterialReceiptItem, MaterialReturnItem } from "./schemas";

export interface InventoryItem {
  id: string;
  name: string;
  category: typeof MATERIAL_CATEGORIES[number];
  storeLocation: typeof STORE_LOCATIONS[number];
  quantityOnHand: number;
  unitOfMeasure: string;
  lastUpdated: Date;
  lowStockThreshold: number;
  heldQuantity?: number;
  holdReason?: string;
  holdUntil?: Date;
  isFlaggedForScrap?: boolean;
}

export let mockInventoryData: InventoryItem[] = [
  { id: "MAT001", name: "Steel Rods - 10mm", category: "Raw Material", storeLocation: "Central Warehouse Alpha", quantityOnHand: 150, unitOfMeasure: "Pieces", lastUpdated: new Date("2024-07-30T10:00:00Z"), lowStockThreshold: 50, heldQuantity: 20, holdReason: "Reserved for Project Phoenix", holdUntil: new Date("2024-08-30") },
  { id: "MAT002", name: "Circuit Board XB-2", category: "Components", storeLocation: "Electronics Sub-Store", quantityOnHand: 25, unitOfMeasure: "Units", lastUpdated: new Date("2024-07-29T14:30:00Z"), lowStockThreshold: 20 },
  { id: "MAT003", name: "Lubricant Oil Grade 5", category: "Consumables", storeLocation: "Maintenance Store", quantityOnHand: 5, unitOfMeasure: "Liters", lastUpdated: new Date("2024-07-31T09:15:00Z"), lowStockThreshold: 10, isFlaggedForScrap: true },
  { id: "MAT004", name: "Safety Goggles", category: "Safety Equipment", storeLocation: "Central Warehouse Alpha", quantityOnHand: 200, unitOfMeasure: "Pairs", lastUpdated: new Date("2024-07-28T11:00:00Z"), lowStockThreshold: 25 },
  { id: "MAT005", name: "Finished Product A", category: "Finished Goods", storeLocation: "Dispatch Area", quantityOnHand: 75, unitOfMeasure: "Units", lastUpdated: new Date("2024-07-31T16:00:00Z"), lowStockThreshold: 15 },
  { id: "MAT006", name: "Copper Wiring - 2.5mm", category: "Raw Material", storeLocation: "Electronics Sub-Store", quantityOnHand: 500, unitOfMeasure: "Meters", lastUpdated: new Date("2024-07-25T08:30:00Z"), lowStockThreshold: 100 },
  { id: "MAT007", name: "Resistor Pack 1Kohm", category: "Components", storeLocation: "Electronics Sub-Store", quantityOnHand: 0, unitOfMeasure: "Packs", lastUpdated: new Date("2024-07-20T12:00:00Z"), lowStockThreshold: 5, isFlaggedForScrap: false },
  { id: "MAT008", name: "Damaged Motor Casing", category: "Components", storeLocation: "Scrap Yard", quantityOnHand: 15, unitOfMeasure: "Units", lastUpdated: new Date("2024-07-22T12:00:00Z"), lowStockThreshold: 0, isFlaggedForScrap: true },
];

// MOCK DATA FOR STORES MANAGEMENT MODULES
export interface MaterialReceipt {
  id: string;
  grnNumber?: string;
  poNumber?: string;
  vendorName: string;
  receiptDate: string; // ISO format
  storeLocation: typeof STORE_LOCATIONS[number];
  items: MaterialReceiptItem[];
  totalItems: number;
  status: "Pending QA" | "Received" | "Partial QA";
}

export const mockReceiptsData: MaterialReceipt[] = [
  { id: "REC001", grnNumber: "GRN2024150", poNumber: "PO2024001", vendorName: "Tech Solutions Inc.", receiptDate: "2024-07-20", storeLocation: "Central Warehouse Alpha", items: [{ materialId: "MAT001", quantity: 50 }], totalItems: 1, status: "Received" },
  { id: "REC002", vendorName: "Industrial Supplies Co.", receiptDate: "2024-07-22", storeLocation: "Sub-Store Gamma", items: [{ materialId: "MAT006", quantity: 200 }], totalItems: 1, status: "Pending QA" },
];

export interface MaterialIssue {
  id: string;
  issueId: string; // for display
  requestCode?: string;
  issuedTo: typeof DEPARTMENTS[number];
  issueDate: string; // ISO format
  storeLocation: typeof STORE_LOCATIONS[number];
  items: MaterialIssueItem[];
  totalItems: number;
  purpose: string;
}

export const mockIssuesData: MaterialIssue[] = [
  { id: "ISS001", issueId: "ISS001", requestCode: "MRQ050", issuedTo: "Production", issueDate: "2024-07-21", storeLocation: "Central Warehouse Alpha", items: [{ materialId: "MAT001", quantity: 30 }], totalItems: 1, purpose: "Scheduled Production" },
  { id: "ISS002", issueId: "ISS002", issuedTo: "Maintenance", issueDate: "2024-07-23", storeLocation: "Sub-Store Gamma", items: [{ materialId: "MAT003", quantity: 2 }], totalItems: 1, purpose: "Urgent Repair" },
];


export interface MaterialReturn {
  id: string;
  originalIssueId?: string;
  returnedBy: typeof DEPARTMENTS[number];
  returnDate: string; // ISO format
  storeLocation: typeof STORE_LOCATIONS[number];
  items: MaterialReturnItem[];
  totalItems: number;
  reason: string;
  condition: "Good" | "Damaged" | "Requires Inspection";
}

export const mockReturnsData: MaterialReturn[] = [
  { id: "RET001", originalIssueId: "ISS001", returnedBy: "Production", returnDate: "2024-07-24", storeLocation: "Central Warehouse Alpha", items: [{ materialId: "MAT001", quantity: 5 }], totalItems: 1, reason: "Excess material", condition: "Good" },
  { id: "RET002", returnedBy: "Maintenance", returnDate: "2024-07-25", storeLocation: "Sub-Store Gamma", items: [{ materialId: "MAT002", quantity: 1 }], totalItems: 1, reason: "Wrong item issued", condition: "Requires Inspection" },
];
