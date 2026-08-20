/** Status BTB dari API */
export type BTBStatus = "DRAFT" | "SUBMITTED" | "FINAL" | string;

/** Baris detail item pada BTB */
export interface BTBDetail {
  id: string;
  item_code: string;
  inventory_item_id: number;
  item_name: string;
  btb_qty: number;
  btb_uom: string;
  created_by: string;
  updated_by: string;
}

/** Header BTB (root object) */
export interface BTB {
  btb_number: string;
  btb_date: string;
  organization_code: string;
  organization_id: string;
  sales_nik: string;
  sales_name: string;
  sales_spv_nik: string;
  sales_spv_name: string;
  status: BTBStatus;
  created_by: string;
  updated_by: string;
  details: BTBDetail[];
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
