import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getExpandedRowModel,
} from "@tanstack/react-table";
import React from "react";
import {
  FaChevronRight,
  FaChevronDown,
  FaAngleLeft,
  FaAngleRight,
} from "react-icons/fa";

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  pageIndex,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
  renderSubComponent,
}: any) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    manualPagination: true,
    pageCount: totalPages,
    state: {
      pagination: {
        pageIndex: pageIndex - 1, // TanStack table 0-based index
        pageSize: pageSize,
      },
    },
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <th className="w-12 px-6 py-4"></th>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-4">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  {/* BARIS UTAMA */}
                  <tr className="hover:bg-slate-50/50"  onClick={row.getToggleExpandedHandler()}>
                    <td className="px-6 py-4">
                      <button
                        className="text-slate-400 hover:text-indigo-600 transition-transform"
                      >
                        {row.getIsExpanded() ? (
                          <FaChevronDown size={12} />
                        ) : (
                          <FaChevronRight size={12} />
                        )}
                      </button>
                    </td>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* BARIS EXPAND (SUB-COMPONENT) */}
                  {row.getIsExpanded() && (
                    <tr>
                      {/* colSpan harus mencakup kolom chevron + kolom data */}
                      <td
                        colSpan={row.getVisibleCells().length + 1}
                        className="p-0 border-b border-slate-100"
                      >
                        {renderSubComponent({ row })}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="text-center py-12">
                  Tidak ada data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER PAGINATION CONTROL */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white">
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded px-2 py-1 outline-none"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              Tampilkan {size}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <button
            disabled={pageIndex <= 1}
            onClick={() => onPageChange(pageIndex - 1)}
            className="p-2 border rounded hover:bg-slate-50 disabled:opacity-30"
          >
            <FaAngleLeft />
          </button>
          <span className="text-xs font-medium text-slate-600">
            Hal {pageIndex} / {totalPages || 1}
          </span>
          <button
            disabled={pageIndex >= totalPages}
            onClick={() => onPageChange(pageIndex + 1)}
            className="p-2 border rounded hover:bg-slate-50 disabled:opacity-30"
          >
            <FaAngleRight />
          </button>
        </div>
      </div>
    </div>
  );
}
