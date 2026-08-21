/** Status BTB dari API */
export type BTBStatus = "DRAFT" | "SUBMITTED" | "FINAL" | string;

/** Baris detail item pada BTB (search / pagination) */
export interface BTBDetail {
  id?: string;
  item_code: string;
  inventory_item_id: number;
  item_name: string;
  btb_qty: number;
  btb_uom: string;
  created_by?: string;
  updated_by?: string;
}

/** Header BTB (pagination / CRUD) */
export interface BTB {
  btb_number: string;
  btb_date: string;
  organization_code: string;
  organization_id?: string;
  sales_nik: string;
  sales_name: string;
  sales_spv_nik: string;
  sales_spv_name: string;
  status?: BTBStatus;
  created_by?: string;
  updated_by?: string;
  details?: BTBDetail[];
  btb_details?: BTBDetail[];
}

/**
 * Hasil GET /btb search by callplan
 * Contoh:
 * {
 *   btb_number, btb_date, organization_code,
 *   call_plan_number, call_plan_start_date,
 *   sales_nik, sales_name, sales_spv_nik, sales_spv_name,
 *   btb_details: [...]
 * }
 */
export interface BTBSearchResult {
  btb_number: string;
  btb_date: string;
  organization_code: string;
  call_plan_number: string;
  call_plan_start_date: string;
  sales_nik: string;
  sales_name: string;
  sales_spv_nik: string;
  sales_spv_name: string;
  btb_details: BTBDetail[];
}

/** Query params search BTB — wajib: sales_nik, call_plan_number, call_plan_start_date */
export interface SearchBTBParams {
  sales_nik: string;
  call_plan_number: string;
  call_plan_start_date: string;
}

/** Detail item untuk POST /btb */
export interface CreateBTBDetailPayload {
  id?: string;
  item_code: string;
  inventory_item_id: number;
  item_name: string;
  btb_qty: number;
  btb_uom: string;
  created_by?: string;
  updated_by?: string;
}

/** Body POST /btb */
export interface CreateBTBPayload {
  btb_number: string;
  btb_date: string;
  organization_code: string;
  organization_id?: string;
  sales_nik: string;
  sales_name: string;
  sales_spv_nik: string;
  sales_spv_name: string;
  status: BTBStatus;
  created_by?: string;
  updated_by?: string;
  details: CreateBTBDetailPayload[];
}

/** Wrapper response POST /btb */
export interface CreateBTBResponse {
  success?: boolean;
  message?: string;
  data?: BTB;
}

/** Meta pagination response GET BTB */
export interface BTBMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Wrapper response GET BTB (list) */
export interface GetBTBResponse {
  success: boolean;
  message: string;
  data: BTB[];
  meta: BTBMeta;
  timestamp: string;
  path: string;
}

/** Query params GET BTB pagination — wajib: page, limit, sortOrder */
export interface GetBTBPaginationParams {
  page: number;
  limit: number;
  sortOrder: "ASC" | "DESC";
  sales_nik?: string;
  sales_spv_nik?: string;
  organization_id?: string;
  organization_code?: string;
  status?: BTBStatus;
  date_from?: string;
  date_to?: string;
  btb_number?: string;
}
