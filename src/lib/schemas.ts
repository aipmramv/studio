
import { z } from 'zod';
import { MATERIAL_TYPES, SCRAP_TYPES, STORE_LOCATIONS, ACTIVITY_TYPES_WORK_PERMIT, USER_ROLES, DEPARTMENTS, REQUEST_TYPES, COST_CENTERS, FISCAL_YEARS, QUARTERS, WORK_PERMIT_FIELD_TYPES } from './constants';

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
  gatePassNumber: z.string().optional(),
});
export type ScrapMovementFormData = z.infer<typeof ScrapMovementSchema>;


export const WorkPermitSchema = z.object({
  building: z.enum(STORE_LOCATIONS, { required_error: "Building/Location is required." }),
  activityType: z.enum(ACTIVITY_TYPES_WORK_PERMIT, { required_error: "Activity type is required." }),
  activityDetails: z.string().min(10, "Please provide more details about the activity (min 10 characters).").max(1000, "Activity details cannot exceed 1000 characters."),
  specificAreaOrEquipment: z.string().min(1, "Specific area/equipment details are required.").max(200, "Too long."),
  permitValidity: z.date({required_error: "Permit validity date is required."}).optional(),
});
export type WorkPermitFormData = z.infer<typeof WorkPermitSchema>;

export const ApprovalSchema = z.object({
  comment: z.string().optional(),
});
export type ApprovalFormData = z.infer<typeof ApprovalSchema>;

const OrderItemSchema = z.object({
  itemName: z.string().min(1, "Item name/description is required."),
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
  sapOrderNumber: z.string().optional(),
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
  sapOrderNumber: z.string().optional(),
});
export type SaleOrderFormData = z.infer<typeof SaleOrderSchema>;

export const AssetManagementSchema = z.object({
    id: z.string().optional(),
    assetNumber: z.string().min(1, "Asset Number is required."),
    materialCode: z.string().optional(),
    assetDescription: z.string().min(1, "Asset Description is required."),
    assetClassification: z.string().optional(),
    assetGrouping: z.string().optional(),
    lifecycleYears: z.coerce.number().min(0).optional(),
    capitalizationDate: z.date().optional(),
    purchaseValue: z.coerce.number().min(0).optional(),
    ledgerQty: z.coerce.number().min(0),
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
    verifiedOn: z.date().optional(),
    usableCondition: z.enum(["Yes", "No", "Partial"]).optional(),
    workingConditionStatus: z.enum(["Working", "Not Working", "Under Maintenance"]).optional(),
    comments: z.string().optional(),
    currentStatus: z.string().optional(),
    statusChangedOn: z.date().optional(),
    movementDcNumber: z.string().optional(),
    dispatchedOn: z.date().optional(),
    expectedReturnDate: z.date().optional(),
    movementResponsible: z.string().optional(),
    returnedOn: z.date().optional(),
    reasonForMovement: z.string().optional(),
    scrapDcNo: z.string().optional(),
    scrapDcDate: z.date().optional(),
    remarks: z.string().optional(),
});
export type AssetManagementFormData = z.infer<typeof AssetManagementSchema>;



export type RequestPayload =
  | MaterialMovementFormData
  | ScrapMovementFormData
  | WorkPermitFormData
  | PurchaseOrderFormData
  | SaleOrderFormData
  | AssetManagementFormData;


export const WorkflowStepSchema = z.object({
  id: z.string().min(1, "Step ID is required."),
  name: z.string().min(1, "Step name is required."),
  assignedRoles: z.array(z.enum(USER_ROLES)).min(1, "At least one role must be assigned."),
  nextStepId: z.string().optional().or(z.literal("")),
  rejectionLeadsToStepId: z.string().optional().or(z.literal("")),
});
export type WorkflowStepFormData = z.infer<typeof WorkflowStepSchema>;

export const WorkflowTemplateSchema = z.object({
  id: z.string().min(1, "Template ID is required."),
  name: z.string().min(1, "Workflow name is required."),
  requestType: z.enum(REQUEST_TYPES, { required_error: "Request type is required." }),
  initialStepId: z.string().min(1, "An initial step must be defined for the workflow.").or(z.literal("")),
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
  triggerEvent: z.string().optional(),
});
export type EmailTemplateFormData = z.infer<typeof EmailTemplateSchema>;

export const CostCenterSchema = z.object({
  name: z.string().min(1, "Cost center name/ID is required."),
});
export type CostCenterFormData = z.infer<typeof CostCenterSchema>;

export const VendorSchema = z.object({
  id: z.string().optional(), 
  name: z.string().min(1, "Vendor name is required."),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phone: z.string().optional(),
  category: z.string().min(1, "Vendor category is required."),
});
export type VendorFormData = z.infer<typeof VendorSchema>;

export const CustomerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Customer name is required."),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address.").optional().or(z.literal('')),
  phone: z.string().optional(),
  industry: z.string().min(1, "Industry is required."),
});
export type CustomerFormData = z.infer<typeof CustomerSchema>;

export const HsnSacCodeSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1, "HSN/SAC code is required."),
  description: z.string().min(1, "Description is required."),
  type: z.enum(["HSN", "SAC"], { required_error: "Type (HSN/SAC) is required."}),
});
export type HsnSacCodeFormData = z.infer<typeof HsnSacCodeSchema>;

export const UomSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Unit name is required."),
  abbreviation: z.string().min(1, "Abbreviation is required.").max(5, "Abbreviation too long."),
});
export type UomFormData = z.infer<typeof UomSchema>;

export const StoreLocationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Store name is required."),
  location: z.string().min(1, "Location description is required."),
  type: z.enum(["Main Warehouse", "Sub-Store", "Production Floor", "Quality Lab", "Dispatch Area", "Receiving Bay"], { required_error: "Store type is required."}),
  manager: z.string().optional(),
});
export type StoreLocationFormData = z.infer<typeof StoreLocationSchema>;

export const DepartmentBudgetSchema = z.object({
  id: z.string().optional(),
  department: z.enum(DEPARTMENTS, { required_error: "Department is required." }),
  year: z.enum(FISCAL_YEARS, { required_error: "Fiscal year is required." }),
  q1Budget: z.coerce.number().min(0, "Budget must be a non-negative number."),
  q2Budget: z.coerce.number().min(0, "Budget must be a non-negative number."),
  q3Budget: z.coerce.number().min(0, "Budget must be a non-negative number."),
  q4Budget: z.coerce.number().min(0, "Budget must be a non-negative number."),
});
export type DepartmentBudgetFormData = z.infer<typeof DepartmentBudgetSchema>;


export const WorkPermitCustomFieldSchema = z.object({
  id: z.string().min(1, "Field ID is required."),
  label: z.string().min(1, "Field label is required."),
  type: z.enum(WORK_PERMIT_FIELD_TYPES, { required_error: "Field type is required." }),
  isRequired: z.boolean().default(false),
  options: z.array(z.string()).optional(), // For dropdown type
});
export type WorkPermitCustomFieldFormData = z.infer<typeof WorkPermitCustomFieldSchema>;

export const WorkPermitTemplateMetadataSchema = z.object({
  id: z.string().min(1, "Template ID is required."),
  name: z.string().min(1, "Template name is required."),
});
export type WorkPermitTemplateMetadataFormData = z.infer<typeof WorkPermitTemplateMetadataSchema>;

export const HoldInventorySchema = z.object({
  quantity: z.coerce.number().min(1, "Quantity to hold must be at least 1."),
  reason: z.string().min(1, "A reason for holding is required."),
  holdUntil: z.date({ required_error: "A 'hold until' date is required." }),
});
export type HoldInventoryFormData = z.infer<typeof HoldInventorySchema>;

// Schemas for Stores Management modules
export const MaterialReceiptItemSchema = z.object({
  materialId: z.string().min(1, "Material ID is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});
export type MaterialReceiptItem = z.infer<typeof MaterialReceiptItemSchema>;

export const MaterialReceiptSchema = z.object({
  grnNumber: z.string().optional(),
  poNumber: z.string().optional(),
  vendorName: z.string().min(1, "Vendor name is required."),
  receiptDate: z.date({ required_error: "Receipt date is required." }),
  storeLocation: z.enum(STORE_LOCATIONS, { required_error: "Store location is required." }),
  status: z.enum(["Pending QA", "Received", "Partial QA"]),
  items: z.array(MaterialReceiptItemSchema).min(1, "At least one item is required."),
});
export type MaterialReceiptFormData = z.infer<typeof MaterialReceiptSchema>;

export const MaterialIssueItemSchema = z.object({
  materialId: z.string().min(1, "Material ID is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});
export type MaterialIssueItem = z.infer<typeof MaterialIssueItemSchema>;

export const MaterialIssueSchema = z.object({
  requestCode: z.string().optional(),
  issuedTo: z.enum(DEPARTMENTS, { required_error: "Issued to department is required." }),
  issueDate: z.date({ required_error: "Issue date is required." }),
  storeLocation: z.enum(STORE_LOCATIONS, { required_error: "Issuing store is required." }),
  purpose: z.string().min(1, "Purpose is required."),
  items: z.array(MaterialIssueItemSchema).min(1, "At least one item is required."),
});
export type MaterialIssueFormData = z.infer<typeof MaterialIssueSchema>;

export const MaterialReturnItemSchema = z.object({
  materialId: z.string().min(1, "Material ID is required."),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
});
export type MaterialReturnItem = z.infer<typeof MaterialReturnItemSchema>;

export const MaterialReturnSchema = z.object({
  originalIssueId: z.string().optional(),
  returnedBy: z.enum(DEPARTMENTS, { required_error: "Returned by department is required." }),
  returnDate: z.date({ required_error: "Return date is required." }),
  storeLocation: z.enum(STORE_LOCATIONS, { required_error: "Return store is required." }),
  reason: z.string().min(1, "Reason for return is required."),
  condition: z.enum(["Good", "Damaged", "Requires Inspection"]),
  items: z.array(MaterialReturnItemSchema).min(1, "At least one item is required."),
});
export type MaterialReturnFormData = z.infer<typeof MaterialReturnSchema>;
