
import { z } from 'zod';
import { USER_ROLES } from './constants';

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
    materialCode: z.string().optional(),
    assetDescription: z.string().min(1, "Asset Description is required."),
    assetClassification: z.string().min(1, "Asset Classification is required."),
    assetGrouping: z.string().optional(),
    lifecycleYears: z.coerce.number().min(0).optional(),
    capitalizationDate: z.date().optional().nullable(),
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
