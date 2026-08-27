import type { ReactNode } from "react";
import type { EnrichedDetail } from "./types";

export type ColumnAlign = "left" | "right" | "center";

export type PickListRow = EnrichedDetail & {
  itemName: string;
  suggestionQty: number;
  finalQty: number;
  qtyRevision: number | null;
  btbQty: number;
  topUpQty: number;
};

export type PickListCellContext = {
  index: number;
  isHighlighted: boolean;
};

export type PrepPickListColumn = {
  id: string;
  header: string;
  /** false = hide tanpa hapus definisi */
  visible?: boolean;
  align?: ColumnAlign;
  headerClassName?: string;
  widthClassName?: string;
  getCellClassName?: (
    row: PickListRow,
    ctx: PickListCellContext,
  ) => string | undefined;
  getValue: (row: PickListRow, ctx: PickListCellContext) => ReactNode;
};

export const getAlignClass = (align: ColumnAlign = "left") => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

export const getVisiblePickListColumns = (
  columns: PrepPickListColumn[],
  options?: { showQtyRevision?: boolean },
) =>
  columns.filter((col) => {
    if (col.id === "qty_revision") return Boolean(options?.showQtyRevision);
    return col.visible !== false;
  });

const qtyCellClass = (row: PickListRow, extra = "") =>
  ["px-3 py-2", row.finalQty === 0 ? "font-bold text-red-600" : "", extra]
    .filter(Boolean)
    .join(" ");

/**
 * Kolom Picking List (Top Up).
 * Tambah / ubah / sembunyikan kolom cukup edit array ini.
 */
export const PREP_PICK_LIST_COLUMNS: PrepPickListColumn[] = [
  {
    id: "no",
    header: "No",
    align: "left",
    getCellClassName: (row) =>
      `px-3 py-2 font-medium ${
        row.finalQty === 0 ? "text-red-700" : "text-slate-800"
      }`,
    getValue: (_row, ctx) => ctx.index + 1,
  },
  {
    id: "item",
    header: "Item",
    align: "left",
    getCellClassName: (row, ctx) =>
      `px-3 py-2 font-medium ${
        ctx.isHighlighted
          ? "text-yellow-900"
          : row.finalQty === 0
            ? "text-red-700"
            : "text-slate-800"
      }`,
    getValue: (row, ctx) => (
      <>
        {row.itemName}
        {ctx.isHighlighted && (
          <span className="ml-2 rounded border border-yellow-400 bg-yellow-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-yellow-900">
            match
          </span>
        )}
      </>
    ),
  },
  {
    id: "qty_suggestion",
    header: "Qty Suggestion",
    align: "center",
    getCellClassName: (row) => qtyCellClass(row),
    getValue: (row) => row.item_qty_suggestion,
  },
  // {
  //   id: "qty_submitted",
  //   header: "Qty Submitted",
  //   align: "center",
  //   getCellClassName: (row) => qtyCellClass(row),
  //   getValue: (row) => row.item_qty_submitted,
  // },
  {
    id: "qty_final",
    header: "Qty Final",
    align: "center",
    getCellClassName: (row) => qtyCellClass(row),
    getValue: (row) => row.finalQty,
  },
  {
    id: "qty_revision",
    header: "Qty Revision",
    align: "center",
    headerClassName: "text-orange-600",
    // visibility dikontrol via getVisiblePickListColumns({ showQtyRevision })
    getCellClassName: () => "px-3 py-2 text-center font-bold text-orange-600",
    getValue: (row) =>
      row.qtyRevision !== null
        ? row.qtyRevision > 0
          ? `+${row.qtyRevision}`
          : row.qtyRevision
        : "-",
  },
  {
    id: "qty_btb",
    header: "Qty BTB",
    align: "center",
    getCellClassName: (row) =>
      `px-3 py-2 text-center ${
        row.finalQty === 0 ? "text-red-500" : "text-blue-600"
      }`,
    getValue: (row) => row.btbQty,
  },
  {
    id: "top_up",
    header: "Top Up",
    align: "center",
    headerClassName: "text-emerald-600",
    getCellClassName: (row) =>
      `px-3 py-2 text-center font-bold ${
        row.finalQty === 0 ? "text-red-600" : "text-emerald-600"
      }`,
    getValue: (row) => row.topUpQty,
  },
];

export const getPickListRowClassName = (
  row: PickListRow,
  isHighlighted: boolean,
) => {
  if (isHighlighted) {
    return "bg-yellow-100 ring-1 ring-yellow-300 hover:bg-yellow-100";
  }
  if (row.finalQty === 0) {
    return "bg-red-50 text-red-700 hover:bg-red-100";
  }
  if (row.qtyRevision !== null) {
    return "bg-orange-50/60 hover:bg-orange-50";
  }
  return "hover:bg-slate-50";
};
