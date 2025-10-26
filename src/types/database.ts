// Client-safe database types (no MongoDB imports)
// Use string for ObjectId to avoid client-side MongoDB imports

export interface User {
  _id?: string
  email: string
  name: string
  role: 'admin' | 'user'
  createdAt: Date
  updatedAt: Date
}

export interface Asset {
  _id?: string
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
  _id?: string
  type: 'purchase' | 'sale' | 'movement' | 'maintenance'
  assetId: string
  userId: string
  date: Date
  details: string
  amount?: number
  location?: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkPermit {
  _id?: string
  permitNumber: string
  type: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  requestedBy: string
  approvedBy?: string
  startDate: Date
  endDate: Date
  description: string
  location: string
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  _id?: string
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