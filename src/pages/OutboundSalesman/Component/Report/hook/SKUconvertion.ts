import { Item } from "../../../../../DynamicAPI/types/ItemTypes";

type MasterItemForConversion = Pick<
  Item,
  "sku" | "inventory_item_id" | "bal_per_dus" | "press_per_bal" | "bks_per_press"
>;

export type SKUConversionResult = {
  caseQty: number;
  balQty: number;
  slopQty: number;
  packQty: number;
};

const normalize = (value: unknown) => String(value ?? "").trim();

const toPositiveNumber = (value: unknown): number => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
};

export const findMasterItemBySkuAndInventory = (
  masterItems: MasterItemForConversion[],
  sku: string,
  inventoryItemId?: string | number | null,
): MasterItemForConversion | undefined => {
  const normalizedSku = normalize(sku);
  const normalizedInvId = normalize(inventoryItemId);

  if (!normalizedSku) return undefined;

  // Primary match: sku + inventory_item_id
  if (normalizedInvId) {
    const exact = masterItems.find(
      (item) =>
        normalize(item.sku) === normalizedSku &&
        normalize(item.inventory_item_id) === normalizedInvId,
    );
    if (exact) return exact;
  }

  // Fallback match: sku only
  return masterItems.find((item) => normalize(item.sku) === normalizedSku);
};

/**
 * Konversi qty Top Up (BKS/PACK) menjadi Case/Bal/Slop/Pack.
 * Rumus:
 * - 1 Bal = press_per_bal * bks_per_press
 * - 1 Case (Dus) = bal_per_dus * press_per_bal * bks_per_press
 * - 1 Slop = bks_per_press
 */
export const convertTopUpBksToCaseBalSlopPack = (
  topUpBks: number,
  masterItem?: MasterItemForConversion,
): SKUConversionResult => {
  let remaining = Math.max(0, Math.floor(Number(topUpBks) || 0));

  if (!masterItem) {
    return {
      caseQty: 0,
      balQty: 0,
      slopQty: 0,
      packQty: remaining,
    };
  }

  const balPerDus = toPositiveNumber(masterItem.bal_per_dus);
  const pressPerBal = toPositiveNumber(masterItem.press_per_bal);
  const bksPerPress = toPositiveNumber(masterItem.bks_per_press);

  const bksPerBal = pressPerBal * bksPerPress;
  const bksPerCase = balPerDus * bksPerBal;

  const caseQty = bksPerCase > 0 ? Math.floor(remaining / bksPerCase) : 0;
  if (bksPerCase > 0) remaining -= caseQty * bksPerCase;

  const balQty = bksPerBal > 0 ? Math.floor(remaining / bksPerBal) : 0;
  if (bksPerBal > 0) remaining -= balQty * bksPerBal;

  const slopQty = bksPerPress > 0 ? Math.floor(remaining / bksPerPress) : 0;
  if (bksPerPress > 0) remaining -= slopQty * bksPerPress;

  return {
    caseQty,
    balQty,
    slopQty,
    packQty: remaining,
  };
};
  