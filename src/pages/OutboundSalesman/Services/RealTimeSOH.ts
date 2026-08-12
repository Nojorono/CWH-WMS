import dayjs from "dayjs";
import axiosInstance from "../../../DynamicAPI/AxiosInstance";
import {
  GetRealTimeSOHParams,
  RealTimeSOHItem,
  RealTimeSOHMeta,
  RealTimeSOHResult,
} from "../types/RealTimeSOHTypes";

export type {
  GetRealTimeSOHParams,
  RealTimeSOHItem,
  RealTimeSOHMeta,
  RealTimeSOHResult,
};

const REALTIME_SOH_PATH = "/outbound-sales/on-hand-meta";
const SUBINVENTORY_CODE = "KECIL";

const buildQueryParams = (
  params: GetRealTimeSOHParams,
): Record<string, string> => ({
  organization_code: params.organization_code || params.organization_name || "",
  subinventory_code: SUBINVENTORY_CODE,
  date: dayjs().format("YYYY-MM-DD"),
});

const normalizeItem = (raw: any): RealTimeSOHItem | null => {
  if (!raw || typeof raw !== "object") return null;

  const pick = (...keys: string[]) => {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null) return raw[key];
    }
    return undefined;
  };

  // Sesuai kebutuhan terbaru: gunakan stok TERSEDIA (avail_to_reserve) sebagai SOH compare.
  const availableQty = Number(
    pick("avail_to_reserve", "AVAIL_TO_RESERVE", "available_qty"),
  );
  const quantityQty = Number(
    pick("quantity", "QUANTITY", "qty", "on_hand_qty", "soh"),
  );
  const normalizedQty = Number.isFinite(availableQty)
    ? availableQty
    : Number.isFinite(quantityQty)
      ? quantityQty
      : 0;

  return {
    id: pick("id", "ID") != null ? String(pick("id", "ID")) : undefined,
    sku: pick("sku", "SKU", "item_code", "ITEM_CODE", "item_number", "ITEM_NUMBER"),
    item_code:
      pick("item_code", "ITEM_CODE", "sku", "SKU", "item_number", "ITEM_NUMBER"),
    item_number: pick("item_number", "ITEM_NUMBER"),
    item_description: pick(
      "item_description",
      "ITEM_DESCRIPTION",
      "description",
      "item_name",
      "ITEM_NAME",
    ),
    inventory_item_id: pick(
      "inventory_item_id",
      "INVENTORY_ITEM_ID",
      "inventoryid",
      "item_id",
    ),
    organization_code: pick("organization_code", "ORGANIZATION_CODE"),
    organization_id: pick("organization_id", "ORGANIZATION_ID"),
    subinventory_code:
      pick("subinventory_code", "SUBINVENTORY_CODE") || SUBINVENTORY_CODE,
    quantity: normalizedQty,
    avail_to_reserve:
      pick("avail_to_reserve", "AVAIL_TO_RESERVE") != null
        ? Number(pick("avail_to_reserve", "AVAIL_TO_RESERVE"))
        : undefined,
    createdAt: pick("createdAt", "created_at", "CREATED_AT") || null,
    updatedAt: pick("updatedAt", "updated_at", "UPDATED_AT") || null,
    raw,
  };
};

const normalizeResponse = (payload: unknown): RealTimeSOHResult => {
  let rows: unknown[] = [];
  let meta: RealTimeSOHMeta | null = null;
  let apiTimestamp: string | undefined;

  if (Array.isArray(payload)) {
    rows = payload;
  } else if (payload && typeof payload === "object") {
    const res = payload as {
      data?: unknown;
      result?: unknown;
      meta?: RealTimeSOHMeta;
      timestamp?: string;
    };
    apiTimestamp = res.timestamp;

    if (Array.isArray(res.data)) {
      rows = res.data;
      meta = res.meta || null;
    } else if (Array.isArray(res.result)) {
      rows = res.result;
      meta = res.meta || null;
    } else if (
      res.data &&
      typeof res.data === "object" &&
      Array.isArray((res.data as { data?: unknown }).data)
    ) {
      const nested = res.data as { data: unknown[]; meta?: RealTimeSOHMeta };
      rows = nested.data;
      meta = nested.meta || res.meta || null;
    }
  }

  const data = rows
    .map((row) => normalizeItem(row))
    .filter((item): item is RealTimeSOHItem => item !== null);

  return {
    data,
    meta: {
      fetchedAt: apiTimestamp || new Date().toISOString(),
      timestamp: apiTimestamp,
      source: "on-hand-meta",
      date: dayjs().format("YYYY-MM-DD"),
      subinventory_code: SUBINVENTORY_CODE,
      ...(meta || {}),
    },
  };
};

export const aggregateRealTimeSOH = (
  items: RealTimeSOHItem[],
): Map<string, number> => {
  const map = new Map<string, number>();

  items.forEach((item) => {
    const key =
      item.inventory_item_id != null &&
      String(item.inventory_item_id).trim() !== ""
        ? String(item.inventory_item_id).trim()
        : String(item.item_code || item.sku || "").trim();

    if (!key) return;
    map.set(key, (map.get(key) || 0) + Number(item.quantity || 0));
  });

  return map;
};

export const realTimeSOHService = {
  getRealTimeSOH: async (
    params: GetRealTimeSOHParams,
  ): Promise<RealTimeSOHResult> => {
    const organizationCode =
      params.organization_code || params.organization_name || "";
    if (!organizationCode) {
      throw new Error("organization_code wajib diisi untuk get Realtime SOH");
    }

    const response = await axiosInstance.get(REALTIME_SOH_PATH, {
      params: buildQueryParams(params),
    });

    return normalizeResponse(response.data);
  },
};
