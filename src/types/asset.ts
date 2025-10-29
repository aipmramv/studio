
export interface AssetData {
  id: string
  asset_number: string
  km_number?: string
  asset_description: string
  asset_classification_id: number
  asset_classification_name: string
  asset_grouping_id?: number
  asset_grouping_name?: string
  lifecycle_years?: number
  capitalization_date?: Date
  eol_date?: Date
  purchase_value?: number
  ledger_qty: number
  brand_name?: string
  model_no?: string
  product_serial_no?: string
  on_going_project?: string
  weekly_usage_frequency?: number
  person_responsible?: string
  current_user?: string
  team_or_tribe_id?: number
  team_or_tribe_name?: string
  department_id: number
  department_name: string
  asset_coordinator?: string
  location_id: number
  location_name: string
  floor?: string
  laboratory?: string
  verification_status?: string
  verified_on?: Date
  usable_condition?: string
  working_condition_status?: string
  comments?: string
  current_status_id: number
  asset_status_name: string
  status_changed_on?: Date
  lifecycle_stage_id?: number
  lifecycle_stage_name?: string
  created_at: Date
  updated_at: Date
}

export interface AssetCreateRequest {
  asset_number: string
  asset_description: string
  department_id: number
  location_id: number
  current_status_id: number
  asset_classification_id: number
  ledger_qty: number
  // Add other fields as needed
}

export interface AssetUpdateRequest extends Partial<AssetCreateRequest> {
  id: string
}

export interface AssetSearchFilters {
  search?: string
  department_id?: number
  status_id?: number
  classification_id?: number
  location_id?: number
  verification_status?: string
  start_date?: string
  end_date?: string
}

export interface AssetListResponse {
  assets: AssetData[]
  total: number
  page: number
  limit: number
  totalPages: number
}