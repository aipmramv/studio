/**
 * Server-only types
 * These types should only be used in server-side code (API routes, server components)
 */

import 'server-only';

// Server-side database interfaces with string IDs
export interface ServerUser {
  _id?: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerAsset {
  _id?: string;
  name: string;
  type: string;
  status: 'available' | 'in-use' | 'maintenance' | 'retired';
  location: string;
  purchaseDate: Date;
  purchasePrice: number;
  currentValue: number;
  assignedTo?: string;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerTransaction {
  _id?: string;
  type: 'purchase' | 'sale' | 'movement' | 'maintenance';
  assetId: string;
  userId: string;
  date: Date;
  details: string;
  amount?: number;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerWorkPermit {
  _id?: string;
  permitNumber: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  approvedBy?: string;
  startDate: Date;
  endDate: Date;
  description: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerMaterial {
  _id?: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  location: string;
  minimumQuantity: number;
  lastRestocked: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Utility functions for ID handling
export function isValidObjectId(id: string): boolean {
  // For now, we can assume any non-empty string is a valid ID.
  // You might want to implement more robust validation, e.g., UUID format.
  return typeof id === 'string' && id.length > 0;
}

export function createObjectId(id?: string): string {
  // If an ID is provided, use it. Otherwise, generate a new one.
  // This is a placeholder for a proper ID generation library like UUID.
  return id || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function objectIdToString(id: string): string {
  return id;
}