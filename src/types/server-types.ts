/**
 * Server-only types that can safely import MongoDB
 * These types should only be used in server-side code (API routes, server components)
 */

import 'server-only';
import { ObjectId } from 'mongodb';

// Re-export MongoDB types for server use
export { ObjectId } from 'mongodb';
export type { 
  ClientSession, 
  Db, 
  Collection, 
  ChangeStream, 
  ChangeStreamDocument,
  Filter,
  FindOptions,
  Sort,
  IndexSpecification,
  CreateIndexesOptions
} from 'mongodb';

// Server-side database interfaces with proper ObjectId types
export interface ServerUser {
  _id?: ObjectId;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerAsset {
  _id?: ObjectId;
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
  _id?: ObjectId;
  type: 'purchase' | 'sale' | 'movement' | 'maintenance';
  assetId: ObjectId;
  userId: ObjectId;
  date: Date;
  details: string;
  amount?: number;
  location?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerWorkPermit {
  _id?: ObjectId;
  permitNumber: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: ObjectId;
  approvedBy?: ObjectId;
  startDate: Date;
  endDate: Date;
  description: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerMaterial {
  _id?: ObjectId;
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

// Utility functions for ObjectId handling
export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

export function createObjectId(id?: string): ObjectId {
  return id ? new ObjectId(id) : new ObjectId();
}

export function objectIdToString(id: ObjectId | string): string {
  return typeof id === 'string' ? id : id.toString();
}