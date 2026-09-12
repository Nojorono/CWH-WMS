export const normalizeWeek = (week: number | null | undefined): string =>
  week == null ? "-" : String(week);

export const normalizeUom = (uom: string | null | undefined): string =>
  (uom || "-").trim().toUpperCase();

/** Kunci unik SKU di gate loading: item + UOM + week */
export const getGateSkuCompositeKey = (params: {
  item_id: string;
  uom?: string | null;
  week_number?: number | null;
}): string =>
  `${params.item_id}|${normalizeUom(params.uom)}|${normalizeWeek(params.week_number)}`;

export const gateSkuMatches = (
  a: {
    item_id: string;
    uom?: string | null;
    week_number?: number | null;
  },
  b: {
    item_id: string;
    uom?: string | null;
    week_number?: number | null;
  },
): boolean =>
  a.item_id === b.item_id &&
  normalizeUom(a.uom) === normalizeUom(b.uom) &&
  normalizeWeek(a.week_number) === normalizeWeek(b.week_number);

export const gateLoadMatchesSku = (
  load: {
    item_id: string;
    pallet_id: string;
    outbound_memo_id: string;
    uom?: string | null;
    week_number?: number | null;
  },
  sku: {
    item_id: string;
    uom?: string | null;
    week_number?: number | null;
  },
  palletId: string,
  memoId: string,
): boolean =>
  load.pallet_id === palletId &&
  load.outbound_memo_id === memoId &&
  gateSkuMatches(load, sku);
