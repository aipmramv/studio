/**
 * Shared type definitions for frontend
 */

export interface User {
  id: string;
  email: string;
  name: string;
  department?: string;
  role: 'admin' | 'spoc' | 'user';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Asset {
  id?: string;
  assetNumber: string;
  assetDescription: string;
  department: string;
  location: string;
  currentStatus: 'Active' | 'Inactive' | 'Reserved' | 'Calibration' | 'Scrap' | 'Verification';
  purchaseValue?: number;
  purchaseDate?: string;
  serialNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface FileUploadResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  size: number;
}

export interface FilterOptions {
  search?: string;
  department?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
