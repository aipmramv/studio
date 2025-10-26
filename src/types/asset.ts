export interface AssetData {
  id: string
  assetNumber: string
  assetDescription: string
  department: string
  location: string
  currentStatus: string
  assetClassification: string
  assetGrouping?: string
  brandName?: string
  modelNo?: string
  productSerialNo?: string
  purchaseValue?: number
  ledgerQty: number
  physicalQty?: number
  capitalizationDate?: Date
  lifecycleYears?: number
  warrantyExpiryDate?: Date
  verificationStatus: string
  lastVerificationDate?: Date
  verificationNotes?: string
  verifiedBy?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastModifiedBy?: string
}

export interface AssetCreateRequest {
  assetDescription: string
  department: string
  location: string
  currentStatus: string
  assetClassification: string
  assetGrouping?: string
  brandName?: string
  modelNo?: string
  productSerialNo?: string
  purchaseValue?: number
  ledgerQty: number
  capitalizationDate?: string
  lifecycleYears?: number
  warrantyExpiryDate?: string
}

export interface AssetUpdateRequest extends Partial<AssetCreateRequest> {
  id: string
}

export interface AssetSearchFilters {
  search?: string
  department?: string
  status?: string
  classification?: string
  location?: string
  verificationStatus?: string
  startDate?: string
  endDate?: string
}

export interface AssetListResponse {
  assets: AssetData[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AssetTransferRequest {
  assetId: string
  toDepartment: string
  toLocation: string
  reason: string
  requiresApproval?: boolean
}

export interface AssetTransfer {
  id: string
  assetId: string
  assetNumber: string
  fromDepartment: string
  toDepartment: string
  fromLocation: string
  toLocation: string
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'
  requestedBy: string
  requestedAt: Date
  approvedBy?: string
  approvedAt?: Date
  completedAt?: Date
  reason: string
  workflowId?: string
}

export interface AssetVerificationRequest {
  assetId: string
  verificationStatus: 'Verified' | 'Discrepancy Found' | 'Not Found'
  physicalQty: number
  condition?: string
  location?: string
  notes?: string
}

export interface AssetHistory {
  id: string
  assetId: string
  action: string
  description: string
  performedBy: string
  performedAt: Date
  details?: Record<string, any>
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
}

export interface AssetExportRequest {
  format: 'excel' | 'csv' | 'pdf'
  filters?: AssetSearchFilters
  includeHistory?: boolean
  includeTransfers?: boolean
}