
import { z } from 'zod';
import { MATERIAL_TYPES, SCRAP_TYPES, BUILDING_TYPES, ACTIVITY_TYPES_WORK_PERMIT, USER_ROLES, DEPARTMENTS, REQUEST_TYPES } from './constants';

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
  itemName: z.string().min(1, "Item name/description is required."), // Material Description
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
  hsnSacCode: z.string().optional(),
  gstPercentage: z.coerce.number().min(0).max(100).optional(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const PurchaseOrderSchema = z.object({
  poCategory: z.string().min(1, "PO Category is required."),
  department: z.enum(DEPARTMENTS, { required_error: "Department is required."}),
  vendorName: z.string().min(1, "Vendor name is required."),
  kmKmgCode: z.string().optional(),
  costCenter: z.string().min(1, "Cost Center is required."),
  ioNumber: z.string().min(1, "IO Number is required."),
  poDate: z.date({ required_error: "PO date is required." }),
  items: z.array(OrderItemSchema).min(1, "At least one item is required."),
  deliveryAddress: z.string().min(1, "Delivery address is required."),
  segment: z.string().optional(),
  paymentTerms: z.string().optional(),
  remarks: z.string().optional(),
});
export type PurchaseOrderFormData = z.infer<typeof PurchaseOrderSchema>;

export const SaleOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required."),
  soDate: z.date({ required_error: "SO date is required." }),
  projectOrCrNo: z.string().min(1, "Project or CR No. is required."),
  saleOrderCategory: z.string().min(1, "Sale Order Category is required."),
  purpose: z.string().min(1, "Purpose is required.").max(500, "Purpose cannot exceed 500 characters."),
  costCenter: z.string().min(1, "Cost Center is required."),
  ioNumber: z.string().min(1, "IO Number is required."),
  budgetAmount: z.coerce.number().min(0, "Budget Amount cannot be negative."),
  materialRequiredDate: z.date({ required_error: "Material Required Date is required." }),
  departmentHeadApproval: z.string().min(1, "Department Head Approval is required."),
  deliveryTo: z.string().min(1, "Delivery To contact/department is required."),
  items: z.array(OrderItemSchema).min(1, "At least one item is required."),
  shippingAddress: z.string().min(1, "Shipping address is required."),
  billingAddress: z.string().min(1, "Billing address is required."),
  remarks: z.string().optional(),
});
export type SaleOrderFormData = z.infer<typeof SaleOrderSchema>;


export type RequestPayload =
  | MaterialMovementFormData
  | ScrapMovementFormData
  | WorkPermitFormData
  | PurchaseOrderFormData
  | SaleOrderFormData;


export const WorkflowStepSchema = z.object({
  id: z.string().min(1, "Step ID is required."), 
  name: z.string().min(1, "Step name is required."),
  assignedRoles: z.array(z.enum(USER_ROLES)).min(1, "At least one role must be assigned."),
  nextStepId: z.string().optional(),
  rejectionLeadsToStepId: z.string().optional(),
});
export type WorkflowStepFormData = z.infer<typeof WorkflowStepSchema>;

export const WorkflowTemplateSchema = z.object({
  id: z.string().min(1, "Template ID is required."), 
  name: z.string().min(1, "Workflow name is required."),
  requestType: z.enum(REQUEST_TYPES, { required_error: "Request type is required." }),
  initialStepId: z.string().min(1, "An initial step must be defined for the workflow."),
});
export type WorkflowTemplateFormData = z.infer<typeof WorkflowTemplateSchema>;

export const MaterialTypeSchema = z.object({
  name: z.string().min(1, "Material type name is required."),
});
export type MaterialTypeFormData = z.infer<typeof MaterialTypeSchema>;

export const InviteUserSchema = z.object({
  email: z.string().email("Invalid email address."),
  role: z.enum(USER_ROLES, { required_error: "Role is required." }),
});
export type InviteUserFormData = z.infer<typeof InviteUserSchema>;

export const EmailTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Template name is required."),
  subject: z.string().min(1, "Subject is required."),
  body: z.string().min(1, "Body is required."),
});
export type EmailTemplateFormData = z.infer<typeof EmailTemplateSchema>;
