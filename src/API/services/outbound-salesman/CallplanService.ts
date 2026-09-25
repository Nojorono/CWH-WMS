import axiosInstance from "../AxiosInstance";
import { Callplan } from "../../types/outbound-salesman/CallplanTypes";

export interface GetCallplansParams {
  dateStart: string;
  organizationId: string;
  /** Jika diisi, filter status. Jika di-omit → Get All SPB tanpa filter status. */
  status?: string;
  /**
   * Filter mo_type (query ke-3 selain date + status).
   * Dipakai terutama untuk status SUBMITTED (FPPR Awal vs Tambahan).
   * FINAL / VOID / dll biasanya di-omit → semua tipe.
   * Contoh: "FPPR Awal" | "FPPR Tambahan"
   */
  mo_type?: string;
}

/** Ambil array Callplan dari berbagai bentuk response API */
const normalizeCallplans = (payload: unknown): Callplan[] => {
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    const nested = payload as { data?: unknown; result?: unknown };
    if (Array.isArray(nested.data)) return nested.data;
    if (Array.isArray(nested.result)) return nested.result;

    if (
      nested.data &&
      typeof nested.data === "object" &&
      Array.isArray((nested.data as { data?: unknown }).data)
    ) {
      return (nested.data as { data: Callplan[] }).data;
    }
  }

  return [];
};

export const callplanService = {
  /**
   * GET /do-suggestion/callplan/date-start/:date/organization/:orgId
   * Query: status?, mo_type?
   * - dengan `status` → filter status
   * - dengan `mo_type` → filter FPPR Awal / FPPR Tambahan
   * - tanpa keduanya → semua SPB tanggal+org
   */
  getCallplans: async (
    { dateStart, organizationId, status, mo_type }: GetCallplansParams,
    options?: { signal?: AbortSignal },
  ): Promise<Callplan[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (mo_type) params.mo_type = mo_type;

    const response = await axiosInstance.get(
      `/do-suggestion/callplan/date-start/${dateStart}/organization/${organizationId}`,
      {
        ...(Object.keys(params).length > 0 ? { params } : {}),
        signal: options?.signal,
      },
    );

    return normalizeCallplans(response.data);
  },

  /** Alias: Get All SPB by date + org (tanpa filter status) */
  getAllCallplansByDateOrg: async (
    params: Omit<GetCallplansParams, "status">,
  ): Promise<Callplan[]> => callplanService.getCallplans(params),

  /**
   * GET /do-suggestion/report/retur?callplanDateStart=YYYY-MM-DD
   * Data SPB untuk Form Retur sudah dibentuk di BE (FINAL / VOID / VOID_NEED_ACTION).
   */
  getReturReport: async (callplanDateStart: string): Promise<Callplan[]> => {
    const response = await axiosInstance.get("/do-suggestion/report/retur", {
      params: { callplanDateStart },
    });
    return normalizeCallplans(response.data);
  },
};
