import type { ReactNode } from "react";
import { Callplan, CallplanDetail } from "../../types/CallplanTypes";

export type ColumnAlign = "left" | "right" | "center";

export type SortDirection = "asc" | "desc";

export type DynamicColumn<T> = {
  id: string;
  header: string;
  /** Set false untuk hide tanpa hapus definisi */
  visible?: boolean;
  /** Bisa di-sort dari header tabel master */
  sortable?: boolean;
  align?: ColumnAlign;
  headerClassName?: string;
  cellClassName?: string;
  /** Ambil nilai dari row; jika tidak diisi, pakai row[id] */
  getValue?: (row: T, index?: number) => ReactNode;
};

export type SummaryCardConfig = {
  id: string;
  label: string;
  unit?: string;
  tone?: "default" | "blue";
  getValue: (row: Callplan) => ReactNode;
};

const alignClass = (align: ColumnAlign = "left") => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

export const getAlignClass = alignClass;

/**
 * Kolom master SPB/Callplan.
 * Tambah/kurang field cukup ubah array ini (atau set visible: false).
 */
export const SPB_MASTER_COLUMNS: DynamicColumn<Callplan>[] = [
  {
    id: "callplan_number",
    header: "Callplan Number",
    sortable: true,
    cellClassName: "text-gray-600",
  },
  {
    id: "spb_number",
    header: "SPB Number",
    sortable: true,
    cellClassName: "text-gray-600",
  },
  {
    id: "mo_type",
    header: "MO Type",
    sortable: true,
    cellClassName: "text-gray-600",
    getValue: (row) => row.mo_type?.trim() || "-",
  },
  {
    id: "sales_nik",
    header: "NIK Sales",
    sortable: true,
    cellClassName: "text-gray-600",
  },
  {
    id: "sales_name",
    header: "Nama Sales",
    sortable: true,
    cellClassName: "text-gray-800 font-medium",
  },
  {
    id: "sales_spv",
    header: "Nama SPV",
    visible: false,
    cellClassName: "text-gray-600",
  },
  {
    id: "sales_spv_nik",
    header: "NIK SPV",
    visible: false,
    cellClassName: "text-gray-600",
  },
  {
    id: "total_sku",
    header: "Total SKU",
    cellClassName: "text-gray-800",
    getValue: (row) => row.details?.length || 0,
  },
  {
    id: "callplan_date_start",
    header: "Start Date",
    sortable: true,
    cellClassName: "text-gray-600",
  },
  {
    id: "callplan_date_end",
    header: "End Date",
    cellClassName: "text-gray-600",
  },
  {
    id: "status",
    header: "Status",
    cellClassName: "font-semibold text-gray-700",
  },
  {
    id: "action",
    header: "Action",
    cellClassName: "font-semibold text-gray-700",
  },
];

/**
 * Kolom detail expand (SKU lines).
 */
export const SPB_DETAIL_COLUMNS: DynamicColumn<CallplanDetail>[] = [
  {
    id: "no",
    header: "No",
    headerClassName: "w-16",
    cellClassName: "text-gray-500",
    getValue: (_row, index = 0) => index + 1,
  },
  {
    id: "item_name",
    header: "Item Name",
    cellClassName: "font-medium text-gray-800",
    // Sementara pakai item_code sampai mapping master item tersedia
    getValue: (row) => row.item_code,
  },
  {
    id: "item_code",
    header: "SKU",
    cellClassName: "text-gray-400",
  },
  {
    id: "item_qty_suggestion",
    header: "Qty Suggestion",
    align: "right",
    cellClassName: "font-bold text-gray-800",
  },
  {
    id: "item_qty_void",
    header: "Qty Void",
    visible: false,
    align: "right",
    cellClassName: "font-bold text-red-600",
  },
];

/**
 * Summary card di area expand.
 */
export const SPB_DETAIL_SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    id: "total_sku",
    label: "Total SKU SPB",
    unit: "Item",
    tone: "default",
    getValue: (row) => row.details?.length || 0,
  },
  {
    id: "total_qty",
    label: "Total Qty SPB",
    unit: "BKS",
    tone: "blue",
    getValue: (row) =>
      (
        row.details?.reduce(
          (acc, curr) => acc + Number(curr.item_qty_suggestion || 0),
          0,
        ) || 0
      ).toLocaleString("id-ID"),
  },
];

export const resolveCellValue = <T extends Record<string, any>>(
  column: DynamicColumn<T>,
  row: T,
  index?: number,
): ReactNode => {
  if (column.getValue) return column.getValue(row, index);
  const raw = row[column.id as keyof T];
  if (raw === null || raw === undefined || raw === "") return "-";
  return raw as ReactNode;
};

export const getVisibleColumns = <T>(columns: DynamicColumn<T>[]) =>
  columns.filter((col) => col.visible !== false);

const getCallplanSortValue = (row: Callplan, sortKey: string): string | number => {
  if (sortKey === "total_sku") {
    return row.details?.length || 0;
  }

  const raw = row[sortKey as keyof Callplan];
  if (raw === null || raw === undefined) return "";

  if (sortKey === "callplan_date_start") {
    return String(raw);
  }

  return String(raw).toLowerCase();
};

export const sortCallplans = (
  rows: Callplan[],
  sortKey: string,
  direction: SortDirection,
): Callplan[] => {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const av = getCallplanSortValue(a, sortKey);
    const bv = getCallplanSortValue(b, sortKey);

    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * multiplier;
    }

    const aStr = String(av);
    const bStr = String(bv);
    if (aStr < bStr) return -1 * multiplier;
    if (aStr > bStr) return 1 * multiplier;
    return 0;
  });
};
