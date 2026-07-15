/* =============================
 * OPENING STOCK BALANCE — Status & Source
 * ============================= */

export type OpeningStockBalanceStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | string;

export type OpeningStockBalanceSource = "MANUAL" | "IMPORT" | "SYSTEM" | string;

/* =============================
 * ITEM (line) — payload create/update (by code)
 * ============================= */

export interface OpeningStockBalanceItemPayload {
  item_code: string;
  warehouse_sub_code: string;
  warehouse_bin_code?: string | null;
  pallet_code?: string | null;
  quantity: number;
  uom: string;
  production_date?: string | null;
  week_number?: number | null;
  notes?: string | null;
}

/* =============================
 * HEADER — payload create (API request body)
 * ============================= */

export interface OpeningStockBalanceCreateRequest {
  code?: string;
  document?: string;
  organization_id: string;
  period_date: string; // YYYY-MM-DD
  week_number?: number | null;
  notes?: string | null;
  status?: OpeningStockBalanceStatus;
  source?: OpeningStockBalanceSource;
  items: OpeningStockBalanceItemPayload[];
}

/* =============================
 * HEADER — payload update
 * ============================= */

export interface OpeningStockBalanceUpdateRequest {
  document?: string;
  period_date?: string;
  week_number?: number | null;
  notes?: string | null;
  status?: OpeningStockBalanceStatus;
  source?: OpeningStockBalanceSource;
  items?: OpeningStockBalanceItemPayload[];
}

/* =============================
 * ITEM (line) — entity dari DB / API response
 * ============================= */

export interface OpeningStockBalanceItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  opening_stock_balance_id: string;

  item_id?: string | null;
  item_code: string;

  warehouse_sub_id?: string | null;
  warehouse_sub_code: string;

  warehouse_bin_id?: string | null;
  warehouse_bin_code?: string | null;

  pallet_id?: string | null;
  pallet_code?: string | null;

  quantity: number;
  uom: string;
  production_date?: string | null;
  week_number?: number | null;
  notes?: string | null;
}

/* =============================
 * HEADER — entity dari DB / API response
 * ============================= */

export interface OpeningStockBalance {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  code: string;
  document?: string | null;
  organization_id: string;
  period_date: string;
  week_number?: number | null;
  notes?: string | null;
  status: OpeningStockBalanceStatus;
  source: OpeningStockBalanceSource;

  created_by?: string | null;
  updated_by?: string | null;

  items: OpeningStockBalanceItem[];
}

/* =============================
 * Helper aliases
 * ============================= */

export type CreateOpeningStockBalance = OpeningStockBalanceCreateRequest;
export type UpdateOpeningStockBalance = OpeningStockBalanceUpdateRequest;
