import axios from "axios";
import { DoSuggestionService } from "../../../../utils/EndPoint";
import { BTBDetail, BTBSearchResult, SearchBTBParams } from "./types";

export type { SearchBTBParams, BTBSearchResult };

/**
 * Hit langsung ke staging DoSuggestionService:
 * https://staging-api.nna-id.com/api/wms/v1/btb?...
 */
const BTB_SEARCH_URL = `${DoSuggestionService}/api/wms/v1/btb`;
const BTB_APPLIED_URL = `${DoSuggestionService}/api/wms/v1/btb/applied`;

const BTB_SEARCH_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "x-dms-app-id": import.meta.env.VITE_DMS_APP_ID,
  "x-dms-app-secret": import.meta.env.VITE_DMS_APP_SECRET,
};


type ApiErrorBody = {
  success?: boolean;
  message?: string | string[];
  error?: string;
  code?: string;
  statusCode?: number;
};

/** Error bisnis dari API search BTB (HTTP 200 dengan success:false) */
export class BTBSearchApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "BTBSearchApiError";
    this.code = code;
  }
}

const extractApiMessage = (
  data: ApiErrorBody | undefined,
  fallback: string,
): string => {
  if (Array.isArray(data?.message) && data.message.length > 0) {
    return data.message.join("\n");
  }
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }
  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }
  return fallback;
};

/** Normalisasi pesan error API (string | string[]) */
export const parseBTBApiError = (
  error: unknown,
  fallback = "Terjadi kesalahan saat mencari BTB",
): string => {
  if (error instanceof BTBSearchApiError) return error.message;

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | undefined;
    return extractApiMessage(data, error.message || fallback);
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

/** Deteksi response bisnis gagal (success:false) meski HTTP 200 */
const assertSearchBusinessSuccess = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return;

  const res = payload as ApiErrorBody;
  if (res.success !== false) return;

  const message = extractApiMessage(
    res,
    "Gagal mencari BTB",
  );
  throw new BTBSearchApiError(message, res.code);
};

/** Bangun query — hanya kirim param yang terisi */
const buildSearchParams = (
  params: SearchBTBParams,
): Record<string, string> => {
  const query: Record<string, string> = {
    call_plan_number: params.call_plan_number.trim(),
  };
  const salesNik = params.sales_nik?.trim();
  const startDate = params.call_plan_start_date?.trim();
  if (salesNik) query.sales_nik = salesNik;
  if (startDate) query.call_plan_start_date = startDate;
  return query;
};

const assertRequiredParams = (params: SearchBTBParams) => {
  if (!params.call_plan_number?.trim()) {
    throw new Error("call_plan_number wajib diisi");
  }
};

/** Normalisasi response: single object | array | { data } */
const normalizeSearchResponse = (payload: unknown): BTBSearchResult | null => {
  if (!payload || typeof payload !== "object") return null;

  const res = payload as Record<string, unknown>;

  // { data: BTBSearchResult } atau { data: BTBSearchResult[] }
  if (res.data && typeof res.data === "object") {
    if (Array.isArray(res.data)) {
      return normalizeItem(res.data[0] as Partial<BTBSearchResult>);
    }
    return normalizeItem(res.data as Partial<BTBSearchResult>);
  }

  // Array langsung
  if (Array.isArray(payload)) {
    return normalizeItem(payload[0] as Partial<BTBSearchResult>);
  }

  // Single object
  if ("btb_number" in res || "call_plan_number" in res) {
    return normalizeItem(res as Partial<BTBSearchResult>);
  }

  return null;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const toNullableString = (value: unknown): string | null => {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const normalizeDetail = (
  detail?: Partial<BTBDetail> | null,
): BTBDetail | null => {
  if (!detail || typeof detail !== "object") return null;

  const itemCode = String(detail.item_code || "").trim();
  if (!itemCode) return null;

  const inventoryItemId = Number(detail.inventory_item_id);
  const btbQty = Number(detail.btb_qty);

  return {
    id: detail.id,
    item_code: itemCode,
    inventory_item_id: Number.isFinite(inventoryItemId) ? inventoryItemId : 0,
    item_name: String(detail.item_name || "").trim(),
    item_number: toNullableString(detail.item_number),
    type: toNullableString(detail.type),
    year: toNullableNumber(detail.year),
    bandrol_price: toNullableNumber(detail.bandrol_price),
    bs_price: toNullableNumber(detail.bs_price),
    btb_qty: Number.isFinite(btbQty) ? btbQty : 0,
    btb_uom: String(detail.btb_uom || "BKS").trim() || "BKS",
    created_by: detail.created_by,
    updated_by: detail.updated_by,
  };
};

const normalizeDetails = (details: unknown): BTBDetail[] => {
  if (!Array.isArray(details)) return [];
  return details
    .map((item) => normalizeDetail(item as Partial<BTBDetail>))
    .filter((item): item is BTBDetail => item != null);
};

const normalizeItem = (
  item?: Partial<BTBSearchResult> | null,
): BTBSearchResult | null => {
  if (!item) return null;

  return {
    btb_number: item.btb_number ?? "",
    btb_date: item.btb_date ?? "",
    organization_code: item.organization_code ?? "",
    call_plan_number: item.call_plan_number ?? "",
    call_plan_start_date: item.call_plan_start_date ?? "",
    sales_nik: item.sales_nik ?? "",
    sales_name: item.sales_name ?? "",
    sales_spv_nik: item.sales_spv_nik ?? "",
    sales_spv_name: item.sales_spv_name ?? "",
    btb_details: normalizeDetails(item.btb_details),
  };
};

export const btbSearchService = {
  /**
   * GET /api/wms/v1/btb (via DoSuggestionService)
   * Wajib: call_plan_number; opsional: sales_nik, call_plan_start_date
   * Headers: Content-Type, Accept, x-dms-app-id, x-dms-app-secret
   */
  searchBTB: async (
    params: SearchBTBParams,
  ): Promise<BTBSearchResult | null> => {
    assertRequiredParams(params);

    try {
      const response = await axios.get(BTB_SEARCH_URL, {
        params: buildSearchParams(params),
        headers: { ...BTB_SEARCH_HEADERS },
        maxRedirects: 0,
      });

      assertSearchBusinessSuccess(response.data);
      return normalizeSearchResponse(response.data);
    } catch (error) {
      if (error instanceof BTBSearchApiError) throw error;

      const data = axios.isAxiosError(error)
        ? (error.response?.data as ApiErrorBody | undefined)
        : undefined;
      if (data?.success === false) {
        throw new BTBSearchApiError(
          extractApiMessage(data, "Gagal mencari BTB"),
          data.code,
        );
      }

      const message = parseBTBApiError(error);
      console.error("[btbSearchService.searchBTB]", message, error);
      throw new Error(message);
    }
  },

  /**
   * POST /api/wms/v1/btb/applied
   * Body: { btb_number }
   */
  applyBTB: async (btb_number: string): Promise<void> => {
    const number = btb_number?.trim();
    if (!number) {
      throw new Error("btb_number wajib diisi");
    }

    try {
      await axios.post(
        BTB_APPLIED_URL,
        { btb_number: number },
        {
          headers: { ...BTB_SEARCH_HEADERS },
          maxRedirects: 0,
        },
      );
    } catch (error) {
      const message = parseBTBApiError(
        error,
        "Gagal mengirim BTB applied ke DoSuggestion",
      );
      console.error("[btbSearchService.applyBTB]", message, error);
      throw new Error(message);
    }
  },
};

/** Alias singkat */
export const searchBTB = btbSearchService.searchBTB;
export const applyBTB = btbSearchService.applyBTB;
