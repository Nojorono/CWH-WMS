import type { RealTimeSOHItem } from "../../../../API/types/outbound-salesman/RealTimeSOHTypes";
import type { OnHandLocatorItem } from "../../../../API/types/outbound-salesman/OnHandLocatorTypes";

export type SohVsCanvasRow = {
  key: string;
  item_code: string;
  item_number: string;
  item_description: string;
  inventory_item_id: string | null;
  /** on-hand-meta KECIL (avail) */
  kecil_qty: number | null;
  /** on-hand-locator CANVAS/GIT quantity */
  git_qty: number | null;
  /** on-hand-locator CANVAS/GIT avail_to_reserve */
  git_avail: number | null;
  /** kecil_qty − git_avail */
  diff: number | null;
};

export type SohVsCanvasSummary = {
  totalSku: number;
  totalKecil: number;
  totalGitAvail: number;
  totalDiff: number;
};

const itemKey = (args: {
  inventory_item_id?: string | number | null;
  item_code?: string | null;
  item_number?: string | null;
  sku?: string | null;
}) => {
  const code = String(args.item_code || args.sku || "")
    .trim()
    .toUpperCase();
  if (code) return `code:${code}`;

  const itemNumber = String(args.item_number || "")
    .trim()
    .toUpperCase();
  if (itemNumber) return `num:${itemNumber}`;

  const inv =
    args.inventory_item_id != null &&
    String(args.inventory_item_id).trim() !== ""
      ? String(args.inventory_item_id).trim()
      : "";
  if (inv) return `inv:${inv}`;

  return "";
};

/** Gabungkan on-hand-meta (KECIL) vs on-hand-locator (CANVAS/GIT) per SKU */
export const mergeSohVsCanvas = (
  sohItems: RealTimeSOHItem[],
  canvasItems: OnHandLocatorItem[],
): SohVsCanvasRow[] => {
  const map = new Map<
    string,
    {
      item_code: string;
      item_number: string;
      item_description: string;
      inventory_item_id: string | null;
      kecil_qty: number | null;
      git_qty: number | null;
      git_avail: number | null;
    }
  >();

  sohItems.forEach((item) => {
    const key = itemKey({
      inventory_item_id: item.inventory_item_id,
      item_code: item.item_code || item.sku,
      item_number: item.item_number,
      sku: item.sku,
    });
    if (!key) return;

    const existing = map.get(key);
    const qty = Number(item.quantity || 0);
    if (existing) {
      existing.kecil_qty = (existing.kecil_qty ?? 0) + qty;
      return;
    }

    map.set(key, {
      item_code: String(item.item_code || item.sku || "").trim(),
      item_number: String(item.item_number || "").trim(),
      item_description: String(item.item_description || "").trim(),
      inventory_item_id:
        item.inventory_item_id != null
          ? String(item.inventory_item_id)
          : null,
      kecil_qty: qty,
      git_qty: null,
      git_avail: null,
    });
  });

  canvasItems.forEach((item) => {
    const key = itemKey({
      inventory_item_id: item.inventory_item_id,
      item_code: item.item_code,
      item_number: item.item_number,
    });
    if (!key) return;

    const existing = map.get(key);
    const qty = Number(item.quantity || 0);
    const avail = Number(item.avail_to_reserve || 0);

    if (existing) {
      existing.git_qty = (existing.git_qty ?? 0) + qty;
      existing.git_avail = (existing.git_avail ?? 0) + avail;
      if (!existing.item_code && item.item_code) {
        existing.item_code = item.item_code;
      }
      if (!existing.item_number && item.item_number) {
        existing.item_number = item.item_number;
      }
      if (!existing.item_description && item.item_description) {
        existing.item_description = item.item_description;
      }
      return;
    }

    map.set(key, {
      item_code: item.item_code,
      item_number: item.item_number,
      item_description: item.item_description,
      inventory_item_id:
        item.inventory_item_id != null
          ? String(item.inventory_item_id)
          : null,
      kecil_qty: null,
      git_qty: qty,
      git_avail: avail,
    });
  });

  return Array.from(map.entries())
    .map(([key, row]) => {
      const diff =
        row.kecil_qty != null && row.git_avail != null
          ? row.kecil_qty - row.git_avail
          : null;

      return {
        key,
        item_code: row.item_code,
        item_number: row.item_number,
        item_description: row.item_description,
        inventory_item_id: row.inventory_item_id,
        kecil_qty: row.kecil_qty,
        git_qty: row.git_qty,
        git_avail: row.git_avail,
        diff,
      };
    })
    .sort((a, b) =>
      a.item_code.localeCompare(b.item_code, "id", { numeric: true }),
    );
};

export const summarizeSohVsCanvas = (
  rows: SohVsCanvasRow[],
): SohVsCanvasSummary => {
  const summary: SohVsCanvasSummary = {
    totalSku: rows.length,
    totalKecil: 0,
    totalGitAvail: 0,
    totalDiff: 0,
  };

  rows.forEach((row) => {
    summary.totalKecil += row.kecil_qty ?? 0;
    summary.totalGitAvail += row.git_avail ?? 0;
    if (row.diff != null) summary.totalDiff += row.diff;
  });

  return summary;
};
