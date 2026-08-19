import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import {
  BTB,
  BTBMeta,
  GetBTBPaginationParams,
  GetBTBResponse,
} from "./types";

export type { GetBTBPaginationParams };

export type GetBTBPaginationResult = {
  data: BTB[];
  meta: BTBMeta | null;
};

const MANDATORY_PARAM_KEYS: (keyof Pick<
  GetBTBPaginationParams,
  "page" | "limit" | "sortOrder"
>)[] = ["page", "limit", "sortOrder"];

const OPTIONAL_PARAM_KEYS: (keyof GetBTBPaginationParams)[] = [
  "status",
  "organization_id",
  "organization_code",
  "sales_nik",
  "sales_spv_nik",
  "date_from",
  "date_to",
  "btb_number",
];

/** Bangun query: wajib selalu dikirim, opsional hanya jika ada nilainya */
const buildBTBQueryParams = (
  params: GetBTBPaginationParams,
): Record<string, string | number> => {
  const query: Record<string, string | number> = {};

  MANDATORY_PARAM_KEYS.forEach((key) => {
    query[key] = params[key];
  });

  OPTIONAL_PARAM_KEYS.forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query[key] = value as string | number;
    }
  });

  return query;
};

const normalizeBTBResponse = (payload: unknown): GetBTBPaginationResult => {
  if (Array.isArray(payload)) {
    return { data: payload as BTB[], meta: null };
  }

  if (payload && typeof payload === "object") {
    const res = payload as Partial<GetBTBResponse> & { data?: unknown };

    if (Array.isArray(res.data)) {
      return {
        data: res.data as BTB[],
        meta: res.meta ?? null,
      };
    }

    if (
      res.data &&
      typeof res.data === "object" &&
      Array.isArray((res.data as { data?: unknown }).data)
    ) {
      const nested = res.data as { data: BTB[]; meta?: BTBMeta };
      return {
        data: nested.data,
        meta: nested.meta ?? res.meta ?? null,
      };
    }
  }

  return { data: [], meta: null };
};

export const btbPaginationService = {
  /**
   * GET /btb
   * Wajib: page, limit, sortOrder
   * Opsional: status, organization_id, sales_nik, sales_spv_nik, date_from, date_to, dll.
   *
   * Contoh:
   * /btb?page=1&limit=10&sortOrder=DESC&status=DRAFT&organization_id=12345
   */
  getBTB: async (
    params: GetBTBPaginationParams,
  ): Promise<GetBTBPaginationResult> => {
    const response = await axiosInstance.get<GetBTBResponse>("/btb", {
      params: buildBTBQueryParams(params),
    });

    return normalizeBTBResponse(response.data);
  },

  // TODO: POST /btb
  // createBTB: async (payload: CreateBTBPayload) => { ... },

  // TODO: PUT/PATCH /btb/:id
  // updateBTB: async (id: string, payload: UpdateBTBPayload) => { ... },

  // TODO: DELETE /btb/:id
  // deleteBTB: async (id: string) => { ... },
};

/** Alias singkat untuk GET pagination BTB */
export const getBTBPagination = btbPaginationService.getBTB;
