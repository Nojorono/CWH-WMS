import axios from "axios";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import {
  BTB,
  BTBMeta,
  CreateBTBPayload,
  CreateBTBResponse,
  GetBTBPaginationParams,
  GetBTBResponse,
} from "./types";

export type { GetBTBPaginationParams, CreateBTBPayload };

export type GetBTBPaginationResult = {
  data: BTB[];
  meta: BTBMeta | null;
};

/** Response positif (success) / negatif (error) untuk semua BTB service */
export type BTBServiceSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type BTBServiceError = {
  success: false;
  message: string;
  data: null;
  error?: string;
};

export type BTBServiceResult<T> = BTBServiceSuccess<T> | BTBServiceError;

type ApiErrorBody = {
  success?: boolean;
  message?: string | string[];
  error?: string;
  code?: string;
  statusCode?: number;
};

const MANDATORY_PARAM_KEYS: (keyof Pick<
  GetBTBPaginationParams,
  "page" | "limit" | "status"
>)[] = ["page", "limit", "status"];

const OPTIONAL_PARAM_KEYS: (keyof GetBTBPaginationParams)[] = [
  "sortOrder",
  "organization_id",
  "organization_code",
  "sales_nik",
  "sales_spv_nik",
  "date_from",
  "date_to",
  "btb_number",
];

const ok = <T>(data: T, message: string): BTBServiceSuccess<T> => ({
  success: true,
  message,
  data,
});

const fail = (message: string, error?: string): BTBServiceError => ({
  success: false,
  message,
  data: null,
  ...(error ? { error } : {}),
});

/** Normalisasi pesan error API (string | string[] | Error | axios) */
const parseBTBServiceError = (
  error: unknown,
  fallback: string,
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
  if (typeof error === "string" && error.trim()) return error;
  return fallback;
};

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

const normalizeCreateResponse = (payload: unknown): BTB | null => {
  if (!payload || typeof payload !== "object") return null;

  const body = payload as CreateBTBResponse | BTB;
  if ("data" in body && body.data) return body.data;
  if ("btb_number" in body) return body as BTB;
  return null;
};

export const BTBservices = {
  /**
   * GET /btb
   * Wajib: page, limit, status
   * Opsional: sortOrder, organization_id, sales_nik, sales_spv_nik, date_from, date_to, dll.
   *
   * Contoh:
   * /btb?page=1&limit=10&status=DRAFT&sortOrder=DESC
   */
  getBTB: async (
    params: GetBTBPaginationParams,
  ): Promise<BTBServiceResult<GetBTBPaginationResult>> => {
    if (!params.page || !params.limit || !params.status?.toString().trim()) {
      return fail("Parameter wajib: page, limit, dan status");
    }

    try {
      const response = await axiosInstance.get<GetBTBResponse>("/btb", {
        params: buildBTBQueryParams(params),
      });

      const body = response.data as Partial<GetBTBResponse> & ApiErrorBody;

      if (body && typeof body === "object" && body.success === false) {
        return fail(
          parseBTBServiceError(body, "Gagal mengambil data BTB"),
          typeof body.error === "string" ? body.error : undefined,
        );
      }

      const normalized = normalizeBTBResponse(response.data);
      return ok(normalized, body?.message || "Berhasil mengambil data BTB");
    } catch (error) {
      const message = parseBTBServiceError(error, "Gagal mengambil data BTB");
      console.error("[BTBservices.getBTB]", message, error);
      return fail(message);
    }
  },

  /**
   * POST /btb — simpan hasil konfirmasi BTB (status DRAFT)
   */
  createBTB: async (
    payload: CreateBTBPayload,
  ): Promise<BTBServiceResult<BTB | null>> => {
    try {
      const response = await axiosInstance.post<CreateBTBResponse | BTB>(
        "/btb",
        payload,
      );

      const body = response.data as (CreateBTBResponse | BTB) & ApiErrorBody;

      if (body && typeof body === "object" && body.success === false) {
        return fail(
          parseBTBServiceError(body, "Gagal menyimpan BTB"),
          typeof body.error === "string" ? body.error : undefined,
        );
      }

      const data = normalizeCreateResponse(response.data);
      const message =
        body && typeof body === "object" && "message" in body
          ? String((body as CreateBTBResponse).message || "BTB berhasil disimpan")
          : "BTB berhasil disimpan";

      return ok(data, message);
    } catch (error) {
      const message = parseBTBServiceError(error, "Gagal menyimpan BTB");
      console.error("[BTBservices.createBTB]", message, error);
      return fail(message);
    }
  },

  // TODO: PUT/PATCH /btb/:id
  // updateBTB: async (id: string, payload: UpdateBTBPayload) => { ... },

  // TODO: DELETE /btb/:id
  // deleteBTB: async (id: string) => { ... },
};

/** Alias singkat untuk GET pagination BTB */
export const getBTBPagination = BTBservices.getBTB;

/** Alias singkat untuk POST create BTB */
export const createBTB = BTBservices.createBTB;
