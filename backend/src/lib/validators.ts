import { z } from 'zod';

// Auth validation schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().optional(),
});

// Asset validation schemas
export const AssetSchema = z.object({
  assetNumber: z.string().min(1, 'Asset number is required').max(50, 'Asset number too long'),
  assetDescription: z.string().min(5, 'Description must be at least 5 characters'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  currentStatus: z.enum(['Active', 'Inactive', 'Reserved', 'Calibration', 'Scrap', 'Verification']),
  purchaseValue: z.number().optional(),
  purchaseDate: z.string().datetime().optional(),
  serialNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

// File upload schema
export const FileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 10 * 1024 * 1024, 'File size must be less than 10MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(file.type),
      'File type must be JPEG, PNG, GIF, or PDF'
    ),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;
export type AssetFormData = z.infer<typeof AssetSchema>;
export type FileUploadData = z.infer<typeof FileUploadSchema>;
