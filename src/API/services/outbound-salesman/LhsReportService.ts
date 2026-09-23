import axiosInstance from "../AxiosInstance";

/** Item agregat GET /outbound-sales/report/lhs */
export type LhsApiItem = {
  item_code: string;
  item_description?: string | null;
  stock_awal?: number | null;
  incoming?: number | null;
  outgoing?: number | null;
  stock_meta?: number | null;
  qty_final?: number | null;
  qty_submitted?: number | null;
  btb_qty?: number | null;
};

export type LhsApiSummaryData = {
  organization_id?: string;
  organization_name?: string;
  date?: string;
  previous_date?: string;
  items?: LhsApiItem[];
};

export type LhsApiDetailRow = {
  ket1: string;
  ket2?: string | null;
  sales_nik?: string | null;
  sales_name?: string | null;
  channel?: string | null;
  quantities?: Record<string, number | null | undefined>;
};

export type LhsApiDetailData = {
  organization_id?: string;
  organization_name?: string;
  date?: string;
  previous_date?: string;
  item_codes?: string[];
  rows?: LhsApiDetailRow[];
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

const unwrap = <T,>(payload: unknown): T | null => {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as ApiEnvelope<T>;
  if (body.data !== undefined) return body.data;
  return payload as T;
};

/**
 * Laporan Stock Harian — API khusus.
 * GET /outbound-sales/report/lhs?date=YYYY-MM-DD
 * GET /outbound-sales/report/lhs/detail?date=YYYY-MM-DD
 */
export const lhsReportService = {
  getSummary: async (
    date: string,
    options?: { signal?: AbortSignal },
  ): Promise<LhsApiSummaryData> => {
    const response = await axiosInstance.get("/outbound-sales/report/lhs", {
      params: { date },
      signal: options?.signal,
      timeout: 60000,
    });
    const data = unwrap<LhsApiSummaryData>(response.data);
    return data || { items: [] };
  },

  getDetail: async (
    date: string,
    options?: { signal?: AbortSignal },
  ): Promise<LhsApiDetailData> => {
    const response = await axiosInstance.get(
      "/outbound-sales/report/lhs/detail",
      {
        params: { date },
        signal: options?.signal,
        timeout: 60000,
      },
    );
    const data = unwrap<LhsApiDetailData>(response.data);
    return data || { item_codes: [], rows: [] };
  },
};
