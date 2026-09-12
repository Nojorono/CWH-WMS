import { Callplan, CallplanDetail } from "../../types/CallplanTypes";
import {
  DynamicColumn,
  SummaryCardConfig,
} from "../SPB/spbTableConfig";

/** Master columns — tanpa Action (Rekap FINAL read-only) */
export const REKAP_MASTER_COLUMNS: DynamicColumn<Callplan>[] = [
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
    id: "status",
    header: "Status",
    cellClassName: "font-semibold text-emerald-700",
  },
];

const qtyOrDash = (value: string | null | undefined) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "-";
  }
  return value;
};

/** Detail: Qty Suggestion, Qty Submitted, Qty Final */
export const REKAP_DETAIL_COLUMNS: DynamicColumn<CallplanDetail>[] = [
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
    // Di-resolve ke master.description di SPBTable
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
    id: "item_qty_submitted",
    header: "Qty Submitted",
    align: "right",
    cellClassName: "font-bold text-slate-700",
    getValue: (row) => qtyOrDash(row.item_qty_submitted),
  },
  {
    id: "item_qty_final",
    header: "Qty Final",
    align: "right",
    cellClassName: "font-bold text-indigo-700",
    getValue: (row) => qtyOrDash(row.item_qty_final),
  },
];

export const REKAP_DETAIL_SUMMARY_CARDS: SummaryCardConfig[] = [
  {
    id: "total_sku",
    label: "Total SKU SPB",
    unit: "Item",
    tone: "default",
    getValue: (row) => row.details?.length || 0,
  },
  {
    id: "total_qty_final",
    label: "Total Qty Final",
    unit: "Bks",
    tone: "blue",
    getValue: (row) =>
      (
        row.details?.reduce(
          (acc, curr) => acc + (Number(curr.item_qty_final) || 0),
          0,
        ) || 0
      ).toLocaleString("id-ID"),
  },
];
