import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import { Callplan } from "./types";

export interface GetCallplansParams {
  dateStart: string;
  organizationId: string;
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
  getCallplans: async ({
    dateStart,
    organizationId,
    status = "SUBMITTED",
  }: GetCallplansParams): Promise<Callplan[]> => {
    const response = await axiosInstance.get(
      `/do-suggestion/callplan/date-start/${dateStart}/organization/${organizationId}`,
      { params: { status } },
    );

    return normalizeCallplans(response.data);
  },
};
