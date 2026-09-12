import type { ReactNode } from "react";
import type { BTBDetail } from "../services/types";

export type ColumnAlign = "left" | "right" | "center";

export type DynamicColumn<T> = {
  id: string;
  header: string;
  /** Set false untuk hide tanpa hapus definisi */
  visible?: boolean;
  align?: ColumnAlign;
  headerClassName?: string;
  cellClassName?: string;
  widthClassName?: string;
  getValue?: (row: T, index: number) => ReactNode;
};

export const getAlignClass = (align: ColumnAlign = "left") => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

export const getVisibleColumns = <T,>(columns: DynamicColumn<T>[]) =>
  columns.filter((col) => col.visible !== false);

/**
 * Kolom detail item hasil search BTB.
 * Tambah/ubah/sembunyikan kolom cukup edit array ini.
 */
export const BTB_SEARCH_DETAIL_COLUMNS: DynamicColumn<BTBDetail>[] = [
  {
    id: "no",
    header: "No",
    widthClassName: "w-12",
    cellClassName: "text-slate-400",
    getValue: (_row, index) => index + 1,
  },
  {
    id: "item_name",
    header: "Item Name",
    cellClassName: "font-semibold",
    getValue: (row) => row.item_name || "-",
  },
  {
    id: "item_code",
    header: "SKU",
    cellClassName: "text-slate-400",
    getValue: (row) => row.item_code || "-",
  },
  {
    id: "btb_qty",
    header: "Qty",
    align: "right",
    cellClassName: "font-bold text-[#F97316]",
    getValue: (row) => `${row.btb_qty} ${row.btb_uom || ""}`.trim(),
  },
];
