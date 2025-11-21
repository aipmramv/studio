// Auth types
export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'spoc' | 'user';
  department?: string;
  iat: number;
  exp: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'spoc' | 'user';
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Asset types
export interface Asset {
  _id?: string;
  assetNumber: string;
  assetDescription: string;
  department: string;
  location: string;
  currentStatus: 'Active' | 'Inactive' | 'Reserved' | 'Calibration' | 'Scrap' | 'Verification';
  purchaseValue?: number;
  purchaseDate?: Date;
  attachments?: {
    invoice?: string;
    warranty?: string;
    calibrationCert?: string;
    photos?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Request context with user
export interface RequestContext {
  user: JWTPayload;
  userId: string;
  userRole: 'admin' | 'spoc' | 'user';
  department?: string;
}
