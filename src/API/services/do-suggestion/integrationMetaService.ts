import {
  MoveOrderIntegrationParams,
  MoveOrderIntegrationResponse,
} from "../../types/DOsuggestionIntegration";
import axiosInstance from "../AxiosInstance";

const toSortTime = (
  row: MoveOrderIntegrationResponse["data"][number],
): number => {
  const raw = String(
    row.updatedAt ||
      row.last_update_date ||
      row.createdAt ||
      row.creation_date ||
      "",
  ).trim();
  if (!raw) return 0;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const t = new Date(normalized).getTime();
  return Number.isFinite(t) ? t : 0;
};

export const getMoveOrderIntegration = async (
  params: MoveOrderIntegrationParams,
  signal?: AbortSignal,
): Promise<MoveOrderIntegrationResponse> => {
  try {
    const response = await axiosInstance.get("/move-order-integration", {
      params: {
        page: params.page,
        limit: params.limit,
        sortBy: params.sortBy || "updatedAt",
        sortOrder: params.sortOrder || "DESC",
        iface_status: params.iface_status || undefined,
        source_system: params.source_system || "WMS",
        search: params.search || undefined,
        request_number: params.request_number || undefined,
        description: params.description || undefined,
        sku: params.sku || undefined,
      },
      signal,
    });

    const body = response.data as MoveOrderIntegrationResponse;
    const rows = Array.isArray(body?.data) ? [...body.data] : [];
    rows.sort((a, b) => toSortTime(b) - toSortTime(a));

    return {
      ...body,
      data: rows,
    };
  } catch (error) {
    throw error;
  }
};

export const pollMoveOrderIntegration = async (id: string) => {
  const response = await axiosInstance.get(
    `/move-order-integration/polling/${id}`,
  );
  return response.data;
};
