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
};

const alignClass = (align: LhsColumnAlign | undefined) => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

/**
 * Table reusable untuk tab LHS — column di-define per tab.
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
}: Props<T>) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${minWidthClassName} text-left text-sm`}>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
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
      {footerNote}
    </div>
  );
}

export default LhsTable;
