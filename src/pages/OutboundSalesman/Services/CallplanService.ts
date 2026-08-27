import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { Callplan } from "../types/CallplanTypes";

export interface GetCallplansParams {
  dateStart: string;
  organizationId: string;
  /** Jika diisi, filter status. Jika di-omit → Get All SPB tanpa filter status. */
  status?: string;
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
   * - dengan `status` → filter status
   * - tanpa `status` → semua SPB (FINAL, SUBMITTED, VOID, dll.)
   */
  getCallplans: async ({
    dateStart,
    organizationId,
    status,
  }: GetCallplansParams): Promise<Callplan[]> => {
    const response = await axiosInstance.get(
      `/do-suggestion/callplan/date-start/${dateStart}/organization/${organizationId}`,
      status ? { params: { status } } : undefined,
    );

    return normalizeCallplans(response.data);
  },

  /** Alias: Get All SPB by date + org (tanpa filter status) */
  getAllCallplansByDateOrg: async (
    params: Omit<GetCallplansParams, "status">,
  ): Promise<Callplan[]> => callplanService.getCallplans(params),
};
