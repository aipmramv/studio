import { ObjectId } from 'mongodb'

export interface User {
  _id?: ObjectId
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
  updatedAt: Date
}

export interface Asset {
  _id?: ObjectId
  name: string
  type: string
  status: 'available' | 'in-use' | 'maintenance' | 'retired'
  location: string
  purchaseDate: Date
  purchasePrice: number
  currentValue: number
  assignedTo?: string
  lastMaintenance?: Date
  nextMaintenance?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Transaction {
  _id?: ObjectId
  type: 'purchase' | 'sale' | 'movement' | 'maintenance'
  assetId: ObjectId
  userId: ObjectId
  date: Date
  details: string
  amount?: number
  location?: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkPermit {
  _id?: ObjectId
  permitNumber: string
  type: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requestedBy: ObjectId
  approvedBy?: ObjectId
  startDate: Date
  endDate: Date
  description: string
  location: string
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  _id?: ObjectId
  name: string
  type: string
  quantity: number
  unit: string
  location: string
  minimumQuantity: number
  lastRestocked: Date
  createdAt: Date
  updatedAt: Date
}