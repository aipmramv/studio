
import { z } from 'zod';
import { USER_ROLES, DEPARTMENTS, STORE_LOCATIONS, SCRAP_TYPES, ACTIVITY_TYPES_WORK_PERMIT, ASSET_CLASSIFICATIONS, ASSET_STATUSES, TEAMS_AND_TRIBES } from './constants';

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

export const AssetManagementSchema = z.object({
    id: z.string().optional(),
    assetNumber: z.string().min(1, "Asset Number is required."),
    kmNumber: z.string().optional(),
    assetDescription: z.string().min(1, "Asset Description is required."),
    assetClassification: z.enum(ASSET_CLASSIFICATIONS).optional(),
    assetGrouping: z.string().optional(),
    lifecycleYears: z.coerce.number().min(0).optional(),
    capitalizationDate: z.date().optional().nullable(),
    purchaseValue: z.coerce.number().min(0).optional(),
    ledgerQty: z.coerce.number().min(1),
    brandName: z.string().optional(),
    modelNo: z.string().optional(),
    productSerialNo: z.string().optional(),
    onGoingProject: z.string().optional(),
    weeklyUsageFrequency: z.coerce.number().min(0).max(7).optional(),
    personResponsible: z.string().optional(),
    currentUser: z.string().optional(),
    teamOrTribe: z.string().optional(),
    department: z.string().min(1, "Department is required."),
    assetCoordinator: z.string().optional(),
    location: z.string().min(1, "Location is required."),
    floor: z.string().optional(),
    laboratory: z.string().optional(),
    verificationStatus: z.enum(["Verified", "Pending", "Discrepancy"]).optional(),
    verifiedOn: z.date().optional().nullable(),
    usableCondition: z.enum(["Yes", "No", "Partial"]).optional(),
    workingConditionStatus: z.enum(["Working", "Not Working", "Under Maintenance"]).optional(),
    comments: z.string().optional(),
    currentStatus: z.string().optional(),
    statusChangedOn: z.date().optional().nullable(),
    attachments: z.object({
        invoice: z.any().optional(),
        warranty: z.any().optional(),
        calibration: z.any().optional(),
        photo: z.any().optional(),
    }).optional(),
});
export type AssetManagementFormData = z.infer<typeof AssetManagementSchema>;


// Generic schema for simple master data with only a name
const MasterNameSchema = z.object({
  name: z.string().min(1, "Name is required."),
});
export const ActivityTypeSchema = MasterNameSchema;
export type ActivityTypeFormData = z.infer<typeof ActivityTypeSchema>;
export const DepartmentSchema = MasterNameSchema;
export type DepartmentFormData = z.infer<typeof DepartmentSchema>;
export const ScrapTypeSchema = MasterNameSchema;
export type ScrapTypeFormData = z.infer<typeof ScrapTypeSchema>;
export const CostCenterSchema = MasterNameSchema;
export type CostCenterFormData = z.infer<typeof CostCenterSchema>;
export const MaterialTypeSchema = MasterNameSchema;
export type MaterialTypeFormData = z.infer<typeof MaterialTypeSchema>;


export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Customer name is required."),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phone: z.string().optional(),
  industry: z.string().min(1, "Industry is required."),
});
export type CustomerFormData = z.infer<typeof CustomerSchema>;

export const VendorSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Vendor name is required."),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phone: z.string().optional(),
  category: z.string().min(1, "Category is required."),
});
export type VendorFormData = z.infer<typeof VendorSchema>;

export const UomSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Unit name is required."),
  abbreviation: z.string().min(1, "Abbreviation is required."),
});
export type UomFormData = z.infer<typeof UomSchema>;

export const HsnSacCodeSchema = z.object({
  id: z.string(),
  code: z.string().min(1, "Code is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(["HSN", "SAC"], { required_error: "Type is required."}),
});
export type HsnSacCodeFormData = z.infer<typeof HsnSacCodeSchema>;

export const StoreLocationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Store name is required."),
  location: z.string().min(1, "Location description is required."),
  type: z.enum(["Main Warehouse", "Sub-Store", "Production Floor", "Quality Lab", "Dispatch Area", "Receiving Bay"], { required_error: "Store type is required."}),
  manager: z.string().optional(),
});
export type StoreLocationFormData = z.infer<typeof StoreLocationSchema>;

export const DepartmentBudgetSchema = z.object({
    id: z.string(),
    department: z.enum(DEPARTMENTS, { required_error: "Department is required." }),
    year: z.string().min(1, "Fiscal year is required."),
    q1Budget: z.coerce.number().min(0, "Budget must be a positive number."),
    q2Budget: z.coerce.number().min(0, "Budget must be a positive number."),
    q3Budget: z.coerce.number().min(0, "Budget must be a positive number."),
    q4Budget: z.coerce.number().min(0, "Budget must be a positive number."),
});
export type DepartmentBudgetFormData = z.infer<typeof DepartmentBudgetSchema>;

export const InviteUserSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  role: z.enum(USER_ROLES, { required_error: "Role is required."}),
});
export type InviteUserFormData = z.infer<typeof InviteUserSchema>;

export const EmailTemplateSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Template name is required."),
    subject: z.string().min(1, "Subject is required."),
    body: z.string().min(1, "Body cannot be empty."),
    triggerEvent: z.string().optional(),
});
export type EmailTemplateFormData = z.infer<typeof EmailTemplateSchema>;

export const WorkflowTemplateSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Template name is required."),
    requestType: z.string({ required_error: "Request type is required." }),
    initialStepId: z.string().optional(),
});
export type WorkflowTemplateFormData = z.infer<typeof WorkflowTemplateSchema>;

export const WorkflowStepSchema = z.object({
    id: z.string().min(1, "Step ID is required.").regex(/^[a-z0-9_]+$/, "ID must be lowercase alphanumeric with underscores."),
    name: z.string().min(1, "Step name is required."),
    assignedRoles: z.array(z.string()).min(1, "At least one role must be assigned."),
    nextStepId: z.string().optional(),
    rejectionLeadsToStepId: z.string().optional(),
});
export type WorkflowStepFormData = z.infer<typeof WorkflowStepSchema>;


export const WorkPermitTemplateMetadataSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Template name is required."),
});
export type WorkPermitTemplateMetadataFormData = z.infer<typeof WorkPermitTemplateMetadataSchema>;

export const WorkPermitCustomFieldSchema = z.object({
    id: z.string().min(1, "Field ID is required.").regex(/^[a-z0-9_]+$/, "ID must be lowercase alphanumeric with underscores."),
    label: z.string().min(1, "Field label is required."),
    type: z.enum(["text", "number", "checkbox", "date"], { required_error: "Field type is required." }),
    isRequired: z.boolean(),
});
export type WorkPermitCustomFieldFormData = z.infer<typeof WorkPermitCustomFieldSchema>;


export const MaterialMovementSchema = z.object({
  materialType: z.string().min(1, "Material type is required."),
  source: z.string().min(1, "Source location is required."),
  destination: z.string().min(1, "Destination location is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  value: z.coerce.number().min(0, "Value cannot be negative."),
  isReturnable: z.enum(['yes', 'no']),
  vehicleNumber: z.string().optional(),
  eWayBill: z.any().optional(), // For file upload
}).refine(data => !(data.value > 100000 && !data.vehicleNumber), {
  message: "Vehicle number is mandatory for material value > 1,00,000 INR.",
  path: ["vehicleNumber"],
});
export type MaterialMovementFormData = z.infer<typeof MaterialMovementSchema>;


export const ScrapMovementSchema = z.object({
  scrapType: z.enum(SCRAP_TYPES, { required_error: "Scrap type is required." }),
  description: z.string().min(10, "Please provide a detailed description."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  weight: z.coerce.number().min(0.1, "Weight must be at least 0.1."),
  gatePassNumber: z.string().optional(),
  photo: z.any().optional(), // For file upload
});
export type ScrapMovementFormData = z.infer<typeof ScrapMovementSchema>;


export const WorkPermitSchema = z.object({
    building: z.enum(STORE_LOCATIONS, { required_error: "Building/Location is required."}),
    activityType: z.enum(ACTIVITY_TYPES_WORK_PERMIT, { required_error: "Activity type is required." }),
    activityDetails: z.string().min(10, "Please provide detailed activity scope."),
    specificAreaOrEquipment: z.string().min(1, "Specific area or equipment ID is required."),
    permitValidity: z.date().optional(),
    attachments: z.any().optional(),
});
export type WorkPermitFormData = z.infer<typeof WorkPermitSchema>;

export const OrderItemSchema = z.object({
  itemName: z.string().min(1, "Item name is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative."),
  hsnSacCode: z.string().optional(),
  gstPercentage: z.coerce.number().min(0).max(100).optional(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const PurchaseOrderSchema = z.object({
  poCategory: z.string().min(1, "PO Category is required."),
  department: z.enum(DEPARTMENTS, { required_error: "Department is required." }),
  vendorName: z.string().min(1, "Vendor name is required."),
  kmKmgCode: z.string().optional(),
  costCenter: z.string().min(1, "Cost Center is required."),
  ioNumber: z.string().min(1, "IO Number is required."),
  poDate: z.date({ required_error: "PO Date is required." }),
  items: z.array(OrderItemSchema).min(1, "At least one item is required."),
  deliveryAddress: z.string().min(1, "Delivery address is required."),
  segment: z.string().optional(),
  paymentTerms: z.string().optional(),
  remarks: z.string().optional(),
  attachments: z.any().optional(),
  sapOrderNumber: z.string().optional(), // To be filled in later
});
export type PurchaseOrderFormData = z.infer<typeof PurchaseOrderSchema>;

export const SaleOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required."),
  soDate: z.date({ required_error: "SO Date is required." }),
  projectOrCrNo: z.string().min(1, "Project or CR No. is required."),
  saleOrderCategory: z.string().min(1, "Category is required."),
  purpose: z.string().min(1, "Purpose is required."),
  costCenter: z.string().min(1, "Cost Center is required."),
  ioNumber: z.string().min(1, "IO Number is required."),
  budgetAmount: z.coerce.number().min(0),
  materialRequiredDate: z.date({ required_error: "Material required date is required." }),
  departmentHeadApproval: z.string().min(1, "Department Head for approval is required."),
  deliveryTo: z.string().min(1, "Delivery contact/department is required."),
  items: z.array(OrderItemSchema).min(1, "At least one item is required."),
  shippingAddress: z.string().min(1, "Shipping address is required."),
  billingAddress: z.string().optional(),
  remarks: z.string().optional(),
  sapOrderNumber: z.string().optional(), // To be filled in later
});
export type SaleOrderFormData = z.infer<typeof SaleOrderSchema>;


export const HoldInventorySchema = z.object({
    quantity: z.coerce.number().min(1, "Quantity to hold must be at least 1."),
    reason: z.string().min(1, "A reason for holding is required."),
    holdUntil: z.date().optional(),
});
export type HoldInventoryFormData = z.infer<typeof HoldInventorySchema>;


export const MaterialReceiptItemSchema = z.object({
  materialId: z.string().min(1, "Material is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});
export type MaterialReceiptItem = z.infer<typeof MaterialReceiptItemSchema>;

export const MaterialReceiptSchema = z.object({
  id: z.string().optional(),
  grnNumber: z.string().optional(),
  poNumber: z.string().optional(),
  vendorName: z.string().min(1, "Vendor name is required."),
  receiptDate: z.date({ required_error: "Receipt date is required." }),
  storeLocation: z.string({ required_error: "Store location is required." }),
  items: z.array(MaterialReceiptItemSchema).min(1, "At least one item is required."),
  status: z.enum(["Pending QA", "Received", "Partial QA"]),
});
export type MaterialReceiptFormData = z.infer<typeof MaterialReceiptSchema>;


export const MaterialIssueItemSchema = z.object({
  materialId: z.string().min(1, "Material is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});
export type MaterialIssueItem = z.infer<typeof MaterialIssueItemSchema>;

export const MaterialIssueSchema = z.object({
  id: z.string().optional(),
  issueId: z.string().optional(),
  requestCode: z.string().optional(),
  issuedTo: z.string().min(1, "Department is required."),
  issueDate: z.date({ required_error: "Issue date is required." }),
  storeLocation: z.string({ required_error: "Store location is required." }),
  items: z.array(MaterialIssueItemSchema).min(1, "At least one item is required."),
  purpose: z.string().min(1, "Purpose of issue is required."),
});
export type MaterialIssueFormData = z.infer<typeof MaterialIssueSchema>;


export const MaterialReturnItemSchema = z.object({
  materialId: z.string().min(1, "Material is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});
export type MaterialReturnItem = z.infer<typeof MaterialReturnItemSchema>;

export const MaterialReturnSchema = z.object({
  id: z.string().optional(),
  originalIssueId: z.string().optional(),
  returnedBy: z.string().min(1, "Returning department is required."),
  returnDate: z.date({ required_error: "Return date is required." }),
  storeLocation: z.string({ required_error: "Store location is required." }),
  items: z.array(MaterialReturnItemSchema).min(1, "At least one item is required."),
  reason: z.string().min(1, "Reason for return is required."),
  condition: z.enum(["Good", "Damaged", "Requires Inspection"], { required_error: "Condition is required." }),
});
export type MaterialReturnFormData = z.infer<typeof MaterialReturnSchema>;
