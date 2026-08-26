import axios from "axios";
import { DoSuggestionService } from "../../../../utils/EndPoint";
import { BTBSearchResult, SearchBTBParams } from "./types";

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
  message?: string | string[];
  error?: string;
  code?: string;
  statusCode?: number;
};

/** Normalisasi pesan error API (string | string[]) */
export const parseBTBApiError = (
  error: unknown,
  fallback = "Terjadi kesalahan saat mencari BTB",
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorBody | undefined;

    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message.join("\n");
    }
    if (typeof data?.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
    return error.message || fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

/** Bangun query — ketiga param wajib */
const buildSearchParams = (
  params: SearchBTBParams,
): Record<string, string> => ({
  sales_nik: params.sales_nik.trim(),
  call_plan_number: params.call_plan_number.trim(),
  call_plan_start_date: params.call_plan_start_date.trim(),
});

const assertRequiredParams = (params: SearchBTBParams) => {
  if (!params.sales_nik?.trim()) {
    throw new Error("sales_nik wajib diisi");
  }
  if (!params.call_plan_number?.trim()) {
    throw new Error("call_plan_number wajib diisi");
  }
  if (!params.call_plan_start_date?.trim()) {
    throw new Error("call_plan_start_date wajib diisi");
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
    btb_details: Array.isArray(item.btb_details) ? item.btb_details : [],
  };
};

export const btbSearchService = {
  /**
   * GET /api/wms/v1/btb (via DoSuggestionService)
   * Wajib: sales_nik, call_plan_number, call_plan_start_date
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

      return normalizeSearchResponse(response.data);
    } catch (error) {
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
