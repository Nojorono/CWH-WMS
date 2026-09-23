import axiosInstance from "../AxiosInstance";
import {
  GetOnHandLocatorParams,
  OnHandLocatorItem,
  OnHandLocatorResult,
} from "../../types/outbound-salesman/OnHandLocatorTypes";

export type {
  GetOnHandLocatorParams,
  OnHandLocatorItem,
  OnHandLocatorResult,
};

const ON_HAND_LOCATOR_PATH = "outbound-sales/on-hand-locator";
const DEFAULT_SUBINVENTORY = "CANVAS";
const DEFAULT_LOCATOR = "GIT";

const pick = (raw: Record<string, unknown>, ...keys: string[]) => {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return raw[key];
  }
  return undefined;
};

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeItem = (raw: unknown): OnHandLocatorItem | null => {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const itemCode = String(
    pick(row, "ITEM_CODE", "item_code", "sku", "SKU") || "",
  ).trim();
  const inventoryItemIdRaw = pick(
    row,
    "INVENTORY_ITEM_ID",
    "inventory_item_id",
  );
  const inventoryItemId =
    inventoryItemIdRaw != null && String(inventoryItemIdRaw).trim() !== ""
      ? toNumber(inventoryItemIdRaw, NaN)
      : null;

  if (!itemCode && (inventoryItemId == null || Number.isNaN(inventoryItemId))) {
    return null;
  }

  return {
    item_code: itemCode,
    item_number: String(
      pick(row, "ITEM_NUMBER", "item_number") || "",
    ).trim(),
    item_description: String(
      pick(row, "ITEM_DESCRIPTION", "item_description", "description") || "",
    ).trim(),
    inventory_item_id:
      inventoryItemId != null && Number.isFinite(inventoryItemId)
        ? inventoryItemId
        : null,
    organization_id: pick(row, "ORGANIZATION_ID", "organization_id") as
      | number
      | string
      | null
      | undefined,
    organization_code: String(
      pick(row, "ORGANIZATION_CODE", "organization_code") || "",
    ).trim(),
    organization_name: String(
      pick(row, "ORGANIZATION_NAME", "organization_name") || "",
    ).trim(),
    ou_name: String(pick(row, "OU_NAME", "ou_name") || "").trim(),
    subinventory_code: String(
      pick(row, "SUBINVENTORY_CODE", "subinventory_code") || "",
    ).trim(),
    locator_id:
      pick(row, "LOCATOR_ID", "locator_id") != null
        ? toNumber(pick(row, "LOCATOR_ID", "locator_id"))
        : null,
    locator: String(pick(row, "LOCATOR", "locator") || "").trim(),
    locator_name: String(
      pick(row, "LOCATOR_NAME", "locator_name") || "",
    ).trim(),
    quantity: toNumber(pick(row, "QUANTITY", "quantity")),
    avail_to_reserve: toNumber(
      pick(row, "AVAIL_TO_RESERVE", "avail_to_reserve"),
    ),
    raw,
  };
};

const normalizeResponse = (
  payload: unknown,
  params: Required<
    Pick<
      GetOnHandLocatorParams,
      "organization_code" | "subinventory_code" | "locator"
    >
  >,
): OnHandLocatorResult => {
  let rows: unknown[] = [];

  if (Array.isArray(payload)) {
    rows = payload;
  } else if (payload && typeof payload === "object") {
    const res = payload as { data?: unknown; result?: unknown };
    if (Array.isArray(res.data)) rows = res.data;
    else if (Array.isArray(res.result)) rows = res.result;
  }

  return {
    data: rows
      .map((row) => normalizeItem(row))
      .filter((item): item is OnHandLocatorItem => item !== null),
    meta: {
      fetchedAt: new Date().toISOString(),
      source: "on-hand-locator",
      organization_code: params.organization_code,
      subinventory_code: params.subinventory_code,
      locator: params.locator,
    },
  };
};

export const onHandLocatorService = {
  /**
   * GET /outbound-sales/on-hand-locator
   * Default: subinventory_code=CANVAS, locator=GIT
   */
  getOnHandLocator: async (
    params: GetOnHandLocatorParams,
    options?: { signal?: AbortSignal },
  ): Promise<OnHandLocatorResult> => {
    const organizationCode = String(params.organization_code || "").trim();
    if (!organizationCode) {
      throw new Error("organization_code wajib diisi untuk on-hand-locator");
    }

    const subinventoryCode =
      String(params.subinventory_code || DEFAULT_SUBINVENTORY).trim() ||
      DEFAULT_SUBINVENTORY;
    const locator =
      String(params.locator || DEFAULT_LOCATOR).trim() || DEFAULT_LOCATOR;

    const response = await axiosInstance.get(ON_HAND_LOCATOR_PATH, {
      params: {
        organization_code: organizationCode,
        subinventory_code: subinventoryCode,
        locator,
      },
      timeout: 90000,
      signal: options?.signal,
    });

    return normalizeResponse(response.data, {
      organization_code: organizationCode,
      subinventory_code: subinventoryCode,
      locator,
    });
  },
};
