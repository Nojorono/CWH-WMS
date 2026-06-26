import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { PaginationControls } from "./PaginationControls";

// --- INTERFACES ---
interface BaseTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  globalFilter?: string;
  setGlobalFilter?: (val: string) => void;
  isExpandable?: boolean;
  renderSubComponent?: (row: TData, globalFilter?: string) => React.ReactNode;
  headerActions?: React.ReactNode;
  footerAction?: React.ReactNode;
}

// --- MAIN REUSABLE COMPONENT ---
export function BaseTable<TData>({
  data,
  columns,
  globalFilter,
  setGlobalFilter,
  isExpandable = true,
  renderSubComponent,
  headerActions,
  footerAction,
}: BaseTableProps<TData>) {
  // Persiapkan kolom tambahan untuk expander jika diaktifkan
  const finalColumns = React.useMemo(() => {
    if (!isExpandable) return columns;

    const expanderColumn: ColumnDef<TData> = {
      id: "expander",
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="p-1 rounded-md hover:bg-slate-100 text-orange-500 transition-colors cursor-pointer"
        >
          {row.getIsExpanded() ? (
            <FaChevronDown size={14} />
          ) : (
            <FaChevronRight size={14} />
          )}
        </button>
      ),
    };
    return [expanderColumn, ...columns];
  }, [columns, isExpandable]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const rowData = JSON.stringify(row.original).toLowerCase();
      return rowData.includes(searchValue);
    },
    getRowCanExpand: () => isExpandable,
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm">
      {/* Top Controls */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3 justify-between items-center bg-slate-50/50 rounded-t-xl">
        <div className="flex gap-2 items-center">
          {/* Slot untuk aksi tambahan di header (misal tombol Print Qty Per SPB) */}
          {headerActions && (
            <div className="mr-2 border-r border-slate-200 pr-2">
              {headerActions}
            </div>
          )}
        </div>
      </div>
      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600 border-collapse">
          <thead className="bg-slate-300/40 text-slate-500 font-semibold text-xs uppercase tracking-wide">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-5 py-4 whitespace-nowrap ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {/* Indikator Sorting */}
                      {{
                        asc: " 🔼",
                        desc: " 🔽",
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  {/* Master Row */}
                  <tr
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      row.toggleExpanded();
                    }}
                    className={`cursor-pointer hover:bg-slate-50/80 transition-colors ${
                      row.getIsExpanded() ? "bg-slate-50" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-5 py-3.5 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Expanded Detail Row via Render Props */}
                  {row.getIsExpanded() && renderSubComponent && (
                    <tr>
                      <td
                        colSpan={row.getVisibleCells().length}
                        className="p-0 border-b border-slate-200"
                      >
                        {renderSubComponent(row.original, globalFilter)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan={finalColumns.length}
                  className="px-5 py-8 text-center text-slate-500"
                >
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Footer / Pagination & CTA */}

      <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/30 rounded-b-xl">
        {/* Indikator Jumlah Data */}
        <span className="text-sm text-slate-500">
          Showing {table.getRowModel().rows.length} of {data.length} items
        </span>

        {/* Panggil komponen pagination di sini */}
        <PaginationControls table={table} />

        {/* Slot untuk CTA dinamis (e.g. Proceed button) */}
        {footerAction}
      </div>
    </div>
  );
}
