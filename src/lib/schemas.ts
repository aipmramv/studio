
import { z } from 'zod';
import { MATERIAL_TYPES, SCRAP_TYPES, BUILDING_TYPES, ACTIVITY_TYPES_WORK_PERMIT, USER_ROLES, DEPARTMENTS, CURRENCIES } from './constants';

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
export type LoginFormData = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(USER_ROLES, { required_error: "Role is required."}),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
export type SignupFormData = z.infer<typeof SignupSchema>;

export const MaterialMovementSchema = z.object({
  materialType: z.enum(MATERIAL_TYPES, { required_error: "Material type is required." }),
  source: z.string().min(1, "Source is required."),
  destination: z.string().min(1, "Destination is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  currency: z.enum(CURRENCIES, { required_error: "Currency is required." }),
  value: z.coerce.number().min(0, "Value cannot be negative."),
  isReturnable: z.enum(['yes', 'no'], { required_error: "Returnable status is required." }),
  vehicleNumber: z.string().optional(),
});
export type MaterialMovementFormData = z.infer<typeof MaterialMovementSchema>;


export const ScrapMovementSchema = z.object({
  scrapType: z.enum(SCRAP_TYPES, { required_error: "Scrap type is required." }),
  description: z.string().min(1, "Description is required.").max(500, "Description too long."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  weight: z.coerce.number().min(0.1, "Weight must be at least 0.1 KG/Ton/etc."),
});
export type ScrapMovementFormData = z.infer<typeof ScrapMovementSchema>;


export const WorkPermitSchema = z.object({
  building: z.enum(BUILDING_TYPES, { required_error: "Building is required." }),
  activityType: z.enum(ACTIVITY_TYPES_WORK_PERMIT, { required_error: "Activity type is required." }),
  activityDetails: z.string().min(10, "Please provide more details about the activity (min 10 characters).").max(1000, "Activity details cannot exceed 1000 characters."),
});
export type WorkPermitFormData = z.infer<typeof WorkPermitSchema>;

export const ApprovalSchema = z.object({
  comment: z.string().optional(),
});
export type ApprovalFormData = z.infer<typeof ApprovalSchema>;

const OrderItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
});

export const PurchaseOrderSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required."),
  poDate: z.date({ required_error: "PO date is required." }),
  currency: z.enum(CURRENCIES, { required_error: "Currency is required." }),
  items: z.array(OrderItemSchema).min(1, "At least one item is required."),
  deliveryAddress: z.string().min(1, "Delivery address is required."),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});
export type PurchaseOrderFormData = z.infer<typeof PurchaseOrderSchema>;

export const SaleOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required."),
  soDate: z.date({ required_error: "SO date is required." }),
  currency: z.enum(CURRENCIES, { required_error: "Currency is required." }),
  items: z.array(OrderItemSchema).min(1, "At least one item is required."),
  shippingAddress: z.string().min(1, "Shipping address is required."),
  billingAddress: z.string().min(1, "Billing address is required."),
  notes: z.string().optional(),
});
export type SaleOrderFormData = z.infer<typeof SaleOrderSchema>;
