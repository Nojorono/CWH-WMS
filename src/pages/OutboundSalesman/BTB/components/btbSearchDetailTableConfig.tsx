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

const formatPrice = (value: number | null | undefined) => {
  if (value == null || !Number.isFinite(Number(value))) return "-";
  return Number(value).toLocaleString("id-ID");
};

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
    id: "type",
    header: "Type",
    widthClassName: "w-16",
    align: "center",
    cellClassName: "font-semibold",
    getValue: (row) => row.type || "-",
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
    id: "item_number",
    header: "Item Number",
    cellClassName: "text-slate-500 text-xs",
    getValue: (row) => row.item_number || "-",
  },
  {
    id: "year",
    header: "Year",
    align: "center",
    widthClassName: "w-16",
    getValue: (row) => (row.year == null ? "-" : String(row.year)),
  },
  {
    id: "bandrol_price",
    header: "Bandrol",
    align: "right",
    cellClassName: "text-slate-600",
    getValue: (row) => formatPrice(row.bandrol_price),
  },
  {
    id: "bs_price",
    header: "BS Price",
    align: "right",
    cellClassName: "text-slate-600",
    getValue: (row) => formatPrice(row.bs_price),
  },
  {
    id: "btb_qty",
    header: "Qty",
    align: "right",
    cellClassName: "font-bold text-[#F97316]",
    getValue: (row) => `${row.btb_qty} ${row.btb_uom || ""}`.trim(),
  },
];
