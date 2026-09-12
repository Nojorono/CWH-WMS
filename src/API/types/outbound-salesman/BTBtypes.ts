import { Organization } from "./CallplanTypes";

/** Baris detail SKU pada BTB */
export interface BTBDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  btb_uuid: string;
  item_code: string;
  inventory_item_id: string;
  item_name: string;
  btb_qty: number;
  btb_uom: string;
  created_by: string;
  updated_by: string;
}

/** Header BTB (root object per salesman) */
export interface BTB {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  btb_number: string;
  btb_date: string;
  organization_code: string | null;
  organization_id: string;
  organization: Organization;
  sales_nik: string;
  sales_name: string;
  sales_spv_nik: string;
  sales_spv_name: string;
  status: string;
  created_by: string;
  updated_by: string;
  details: BTBDetail[];
}

/** Pagination meta dari response API BTB */
export interface BTBMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Wrapper response GET /btb */
export interface BTBResponse {
  success: boolean;
  message: string;
  data: BTB[];
  meta: BTBMeta;
  timestamp: string;
  path: string;
}

/** Query params untuk GET /btb
 * Wajib: page, limit, sortOrder, sales_nik
 * Opsional: status, organization_id, sales_spv_nik, date_from, date_to
 */
export interface GetBTBParams {
  page: number;
  limit: number;
  sortOrder: "ASC" | "DESC";
  sales_nik: string;
  status?: string;
  organization_id?: string;
  sales_spv_nik?: string;
  date_from?: string;
  date_to?: string;
}
