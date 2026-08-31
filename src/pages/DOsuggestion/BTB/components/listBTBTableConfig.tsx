import type { ReactNode } from "react";
import { BTB, BTBDetail } from "../services/types";

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

const alignClass = (align: ColumnAlign = "left") => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

export const getAlignClass = alignClass;

export const getVisibleColumns = <T,>(columns: DynamicColumn<T>[]) =>
  columns.filter((col) => col.visible !== false);

export const resolveCellValue = <T,>(
  column: DynamicColumn<T>,
  row: T,
  index?: number,
): ReactNode => {
  if (column.getValue) return column.getValue(row, index);
  const raw = (row as Record<string, unknown>)[column.id];
  if (raw === null || raw === undefined || raw === "") return "-";
  return raw as ReactNode;
};

const statusBadgeClass = () => "bg-blue-50 text-blue-700";

/**
 * Kolom master List BTB.
 * Tambah/kurang kolom cukup edit array ini (atau set visible: false).
 */
export const createBtbListMasterColumns = (
  statusLabel: string,
): DynamicColumn<BTB>[] => [
  {
    id: "row_no",
    header: "No",
    headerClassName: "w-12",
    cellClassName: "text-slate-400",
    getValue: (_row, displayNo = 0) => displayNo,
  },
  {
    id: "btb_number",
    header: "BTB Number",
    cellClassName: "font-semibold text-slate-800",
  },
  {
    id: "call_plan_number",
    header: "Call Plan Number",
    cellClassName: "text-slate-600",
  },
  {
    id: "btb_date",
    header: "Tanggal",
  },
  {
    id: "organization_code",
    header: "Org",
  },
  {
    id: "sales",
    header: "Sales",
    getValue: (row) => (
      <>
        <div className="font-semibold uppercase">{row.sales_name || "-"}</div>
        <div className="text-xs text-slate-400">{row.sales_nik || "-"}</div>
      </>
    ),
  },
  {
    id: "spv",
    header: "SPV",
    getValue: (row) => (
      <>
        <div className="font-semibold uppercase">{row.sales_spv_name || "-"}</div>
        <div className="text-xs text-slate-400">{row.sales_spv_nik || "-"}</div>
      </>
    ),
  },
  {
    id: "status",
    header: "Status",
    getValue: (row) => (
      <span
        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass()}`}
      >
        {row.status || statusLabel}
      </span>
    ),
  },
];

/** Kolom detail expand (SKU lines) */
export const BTB_LIST_DETAIL_COLUMNS: DynamicColumn<BTBDetail>[] = [
  {
    id: "no",
    header: "No",
    headerClassName: "w-12",
    cellClassName: "text-slate-400",
    getValue: (_row, index = 0) => index + 1,
  },
  {
    id: "item_name",
    header: "Item Name",
    cellClassName: "font-semibold",
  },
  {
    id: "item_code",
    header: "SKU",
    cellClassName: "text-slate-500",
  },
  {
    id: "btb_qty",
    header: "Qty",
    align: "right",
    cellClassName: "font-bold text-[#F97316]",
    getValue: (row) => `${row.btb_qty} ${row.btb_uom}`,
  },
];
