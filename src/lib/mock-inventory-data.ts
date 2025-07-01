// src/lib/mock-inventory-data.ts
import { MATERIAL_CATEGORIES, STORE_LOCATIONS } from "./constants";

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
