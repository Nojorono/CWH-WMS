import type { ReactNode } from "react";

export type SohCheckLine = {
  id: string;
  callplanId: string;
  spbNumber: string;
  salesName: string;
  sku: string;
  itemName: string;
  qtySuggestion: number;
  qtySubmitted: number;
  qtySpb: number;
  soh: number;
  status: "AVAILABLE" | "LESS_STOCK" | "NO_STOCK";
};

export type ColumnAlign = "left" | "right" | "center";

export type SohCheckCellContext = {
  index: number;
  isGlobal: boolean;
};

export type SohCheckColumn = {
  id: string;
  header: string;
  /** false = hide tanpa hapus definisi */
  visible?: boolean;
  /** Hanya tampil di mode global (multi SPB) */
  globalOnly?: boolean;
  align?: ColumnAlign;
  headerClassName?: string;
  getCellClassName?: (
    row: SohCheckLine,
    ctx: SohCheckCellContext,
  ) => string | undefined;
  getValue: (row: SohCheckLine, ctx: SohCheckCellContext) => ReactNode;
};

export const getVisibleSohCheckColumns = (
  columns: SohCheckColumn[],
  options: { isGlobal: boolean },
) =>
  columns.filter((col) => {
    if (col.visible === false) return false;
    if (col.globalOnly && !options.isGlobal) return false;
    return true;
  });

const statusBadge = (status: SohCheckLine["status"]) => {
  if (status === "AVAILABLE") {
    return {
      label: "Available",
      badgeClass:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
      rowClass: "hover:bg-slate-50/50 transition-colors duration-200",
    };
  }
  if (status === "LESS_STOCK") {
    return {
      label: "Less Stock",
      badgeClass: "bg-amber-500 text-white ring-2 ring-amber-600/40 shadow-sm",
      rowClass:
        "bg-amber-100 hover:bg-amber-200/80 border-l-4 border-l-amber-500 font-medium transition-colors duration-200",
    };
  }
  if (status === "NO_STOCK") {
    return {
      label: "No Stock",
      badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
      rowClass:
        "bg-rose-50/30 hover:bg-rose-50/60 transition-colors duration-200",
    };
  }
  return {
    label: "Available",
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    rowClass: "hover:bg-slate-50/50 transition-colors duration-200",
  };
};

/** Dipakai untuk styling baris (warna status) */
export const getSohCheckRowClass = (status: SohCheckLine["status"]) =>
  statusBadge(status).rowClass;

/**
 * Kolom tabel Integrate SOH Check.
 * Tambah / ubah / sembunyikan kolom cukup edit array ini.
 */
export const INTEGRATE_SOH_CHECK_COLUMNS: SohCheckColumn[] = [
  {
    id: "no",
    header: "No",
    align: "center",
    headerClassName:
      "px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase",
    getCellClassName: () =>
      "px-4 py-3.5 text-center font-medium text-slate-400 group-hover:text-slate-500",
    getValue: (_row, ctx) => ctx.index + 1,
  },
  {
    id: "spb",
    header: "SPB",
    globalOnly: true,
    align: "left",
    headerClassName:
      "px-4 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase",
    getCellClassName: () => "px-4 py-3.5",
    getValue: (row) => (
      <>
        <div className="font-semibold text-slate-800">{row.spbNumber}</div>
        <div className="text-[10px] text-slate-500">{row.salesName}</div>
      </>
    ),
  },
  {
    id: "item_name",
    header: "Item Name",
    align: "left",
    headerClassName:
      "px-4 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase",
    getCellClassName: () => "px-4 py-3.5 font-medium text-slate-900",
    getValue: (row) => row.itemName,
  },
  {
    id: "sku",
    header: "SKU",
    align: "left",
    headerClassName:
      "px-4 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase",
    getCellClassName: () => "px-4 py-3.5 font-mono text-xs text-slate-500",
    getValue: (row) => row.sku,
  },
  {
    id: "qty_submitted",
    header: "Qty Submitted",
    align: "center",
    headerClassName:
      "px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase",
    getCellClassName: () =>
      "px-4 py-3.5 text-center text-sm font-semibold text-slate-600",
    getValue: (row) => row.qtySubmitted,
  },
  {
    id: "qty_spb",
    header: "Qty Final",
    align: "center",
    headerClassName:
      "px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase",
    getCellClassName: () =>
      "px-4 py-3.5 text-center text-sm font-semibold text-slate-700",
    getValue: (row) => row.qtySpb,
  },
  {
    id: "soh",
    header: "Qty On Hand",
    align: "center",
    headerClassName:
      "px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase",
    getCellClassName: () =>
      "px-4 py-3.5 text-center text-sm font-semibold text-indigo-600",
    getValue: (row) => row.soh,
  },
  {
    id: "selisih",
    header: "Selisih",
    align: "center",
    headerClassName:
      "px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase",
    getCellClassName: () => "px-4 py-3.5 text-center text-sm font-bold",
    getValue: (row) => {
      const selisih = row.soh - row.qtySpb;
      return (
        <span className={selisih < 0 ? "text-rose-600" : "text-emerald-600"}>
          {selisih > 0 ? `+${selisih}` : selisih}
        </span>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    align: "center",
    headerClassName:
      "px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase",
    getCellClassName: () => "px-4 py-3.5 text-center",
    getValue: (row) => {
      const badge = statusBadge(row.status);
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${badge.badgeClass}`}
        >
          {badge.label}
        </span>
      );
    },
  },
];
