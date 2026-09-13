import React from "react";

export type LhsColumnAlign = "left" | "right" | "center";

export type LhsColumn<T> = {
  id: string;
  header: React.ReactNode;
  headerClassName?: string;
  align?: LhsColumnAlign;
  cell: (row: T) => React.ReactNode;
  cellClassName?: string;
};

type Props<T> = {
  columns: LhsColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  isLoading?: boolean;
  minWidthClassName?: string;
  footer?: React.ReactNode;
  footerNote?: React.ReactNode;
  /** Jumlah baris SKU yang terlihat sebelum scroll (default 15) */
  maxVisibleRows?: number;
};

const alignClass = (align: LhsColumnAlign | undefined) => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

/** Tinggi approx 1 baris (py-3 + text-sm) */
const ROW_PX = 44;
const HEADER_PX = 44;

/**
 * Table reusable untuk tab LHS — column di-define per tab.
 * Default: tampil 15 baris, sisanya scroll vertikal (header sticky).
 */
function LhsTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "Tidak ada data.",
  isLoading = false,
  minWidthClassName = "min-w-[700px]",
  footer,
  footerNote,
  maxVisibleRows = 15,
}: Props<T>) {
  const needsScroll = data.length > maxVisibleRows;
  const maxHeight = HEADER_PX + maxVisibleRows * ROW_PX;

  return (
    <div>
      <div
        className="overflow-auto"
        style={needsScroll ? { maxHeight } : undefined}
      >
        <table className={`w-full ${minWidthClassName} text-left text-sm`}>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 shadow-sm">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={`px-4 py-3 ${alignClass(col.align)} ${col.headerClassName || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-slate-50/80">
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={`px-4 py-3 ${alignClass(col.align)} ${col.cellClassName || ""}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
          {footer}
        </table>
      </div>
      {footerNote}
    </div>
  );
}

export default LhsTable;
