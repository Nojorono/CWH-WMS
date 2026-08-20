import type { ReactNode } from "react";
import {
  OpeningStockBalance,
  OpeningStockBalanceItem,
} from "../../../DynamicAPI/types/OpeningStockBalance";

export type ColumnAlign = "left" | "right" | "center";

export type DynamicColumn<T> = {
  id: string;
  header: string;
  /** Set false untuk hide tanpa hapus definisi */
  visible?: boolean;
  align?: ColumnAlign;
  headerClassName?: string;
  cellClassName?: string;
  getValue?: (row: T, index?: number) => ReactNode;
};

/** Response API kadang pakai openingBalanceStockItems / total_items */
export type OpeningStockListRow = OpeningStockBalance & {
  total_items?: number;
  openingBalanceStockItems?: OpeningStockBalanceItem[];
};

export type OpeningStockDetailRow = OpeningStockBalanceItem & {
  item?: { description?: string | null };
};

export const getAlignClass = (align: ColumnAlign = "left") => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

export const getStatusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || "bg-slate-100 text-slate-700 border-slate-200"}`;
};

export const getRowDetailItems = (
  row: OpeningStockListRow,
): OpeningStockDetailRow[] => row.openingBalanceStockItems ?? row.items ?? [];

/**
 * Kolom header document.
 * Tambah/kurang kolom cukup edit array ini (atau set visible: false).
 */
export const OPENING_STOCK_MASTER_COLUMNS: DynamicColumn<OpeningStockListRow>[] =
  [
    {
      id: "code",
      header: "Document Code",
      cellClassName: "font-semibold text-blue-600 tracking-tight",
      getValue: (row) => row.code || "-",
    },
    {
      id: "period_date",
      header: "Period Date",
    },
    {
      id: "week_number",
      header: "Week",
      cellClassName: "font-medium",
      getValue: (row) =>
        row.week_number != null ? `W-${row.week_number}` : "-",
    },
    {
      id: "source",
      header: "Source",
      getValue: (row) => (
        <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-600 font-medium">
          {row.source}
        </span>
      ),
    },
    {
      id: "file_name",
      header: "File Name",
      cellClassName: "text-xs text-slate-500 max-w-[180px] truncate",
      getValue: (row) => row.file_name || "-",
    },
    {
      id: "total_items",
      header: "Total Items",
      align: "center",
      cellClassName: "font-bold text-slate-800",
      getValue: (row) => row.total_items ?? row.items?.length ?? 0,
    },
    {
      id: "status",
      header: "Status",
      getValue: (row) => (
        <span className={getStatusBadgeClass(row.status)}>{row.status}</span>
      ),
    },
    // Tambahkan action untuk approve dan reject
    {
      id: "action",
      header: "Action",
      align: "center",
    },
  ];

/** Kolom detail material item lines */
export const OPENING_STOCK_DETAIL_COLUMNS: DynamicColumn<OpeningStockDetailRow>[] =
  [
    {
      id: "item_code",
      header: "Item Code",
      cellClassName: "font-bold text-slate-800",
    },
    {
      id: "description",
      header: "Description",
      cellClassName: "text-slate-500 max-w-[160px] truncate",
      getValue: (row) => row.item?.description || "-",
    },
    {
      id: "warehouse_sub_code",
      header: "Sub Whse",
      cellClassName: "font-medium text-amber-700",
    },
    {
      id: "warehouse_bin_code",
      header: "Bin Code",
      getValue: (row) => row.warehouse_bin_code || "-",
    },
    {
      id: "pallet_code",
      header: "Pallet Code",
      cellClassName: "font-mono text-[11px] text-slate-500",
      getValue: (row) => row.pallet_code || "-",
    },
    {
      id: "quantity",
      header: "Qty",
      align: "right",
      cellClassName: "font-bold text-slate-900",
    },
    {
      id: "uom",
      header: "UoM",
      cellClassName: "font-medium",
    },
    {
      id: "production_date",
      header: "Prod Date",
      getValue: (row) => row.production_date || "-",
    },
    {
      id: "notes",
      header: "Notes",
      cellClassName: "text-slate-400 italic max-w-[140px] truncate",
      getValue: (row) => row.notes || "-",
    },
  ];

export const resolveCellValue = <T extends object>(
  column: DynamicColumn<T>,
  row: T,
  index?: number,
): ReactNode => {
  if (column.getValue) return column.getValue(row, index);
  const raw = (row as Record<string, unknown>)[column.id];
  if (raw === null || raw === undefined || raw === "") return "-";
  return raw as ReactNode;
};

export const getVisibleColumns = <T,>(columns: DynamicColumn<T>[]) =>
  columns.filter((col) => col.visible !== false);
