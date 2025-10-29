import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
export type LoginFormData = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  displayName: z.string().min(2, { message: "Name must be at least 2 characters."}),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  department: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
export type SignupFormData = z.infer<typeof SignupSchema>;

export const AssetManagementSchema = z.object({
    id: z.string().optional(),
    asset_number: z.string().min(1, "Asset Number is required."),
    km_number: z.string().optional(),
    asset_description: z.string().min(1, "Asset Description is required."),
    asset_classification_id: z.number(),
    asset_grouping_id: z.number().optional(),
    lifecycle_years: z.coerce.number().min(0).optional(),
    capitalization_date: z.date().optional().nullable(),
    eol_date: z.date().optional().nullable(),
    purchase_value: z.coerce.number().min(0).optional(),
    ledger_qty: z.coerce.number().min(1),
    brand_name: z.string().optional(),
    model_no: z.string().optional(),
    product_serial_no: z.string().optional(),
    on_going_project: z.string().optional(),
    weekly_usage_frequency: z.coerce.number().min(0).max(7).optional(),
    person_responsible: z.string().optional(),
    current_user: z.string().optional(),
    team_or_tribe_id: z.number().optional(),
    department_id: z.number(),
    asset_coordinator: z.string().optional(),
    location_id: z.number(),
    floor: z.string().optional(),
    laboratory: z.string().optional(),
    verification_status: z.string().optional(),
    verified_on: z.date().optional().nullable(),
    usable_condition: z.string().optional(),
    working_condition_status: z.string().optional(),
    comments: z.string().optional(),
    current_status_id: z.number(),
    status_changed_on: z.date().optional().nullable(),
    lifecycle_stage_id: z.number().optional(),
});
export type AssetManagementFormData = z.infer<typeof AssetManagementSchema>;


// ... (keep other schemas as they are for now)

