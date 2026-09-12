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
  const finalColumns = React.useMemo(() => {
    if (!isExpandable) return columns;

    const expanderColumn: ColumnDef<TData> = {
      id: "expander",
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="p-1 md:p-1.5 rounded-md hover:bg-slate-100 text-orange-500 transition-colors cursor-pointer"
        >
          {row.getIsExpanded() ? (
            <FaChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5" />
          ) : (
            <FaChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
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
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
      {/* --- TOP CONTROLS --- */}
      {headerActions && (
        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl w-full">
          {/* Diubah menjadi flex-col di mobile agar tidak bertabrakan */}
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {headerActions}
          </div>
        </div>
      )}
      {/* -------------------------------- */}

      {/* Main Table Wrapper dengan Horizontal Scroll */}
      {/* Tambahkan custom-scrollbar jika Anda memiliki kelasnya di CSS global */}
      <div className="overflow-x-auto w-full custom-scrollbar">
        <table className="w-full text-left text-xs sm:text-sm text-slate-600 border-collapse min-w-max">
          <thead className="text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      width: header.id === "select" ? "40px" : "auto",
                    }}
                    // Padding diperkecil di mobile (px-3 py-3), kembali normal di desktop (sm:px-4 sm:py-4)
                    className={`sticky top-0 bg-orange-500 px-3 py-3 sm:px-4 sm:py-4 text-left text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                      header.column.getCanSort()
                        ? "cursor-pointer hover:bg-orange-600"
                        : ""
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
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
                        // Padding diperkecil di mobile (px-3 py-2.5) agar isi lebih muat
                        className="px-3 py-2.5 sm:px-5 sm:py-3.5 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Expanded Detail Row */}
                  {row.getIsExpanded() && renderSubComponent && (
                    <tr>
                      <td
                        colSpan={row.getVisibleCells().length}
                        className="p-0 border-b border-slate-200 bg-slate-50/30"
                      >
                        {/* Wrapper untuk memastikan konten expand tidak tembus */}
                        <div className="w-full overflow-hidden">
                          {renderSubComponent(row.original, globalFilter)}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td
                  colSpan={finalColumns.length}
                  className="px-5 py-8 text-center text-slate-500 text-xs sm:text-sm"
                >
                  Tidak ada data yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination & CTA */}
      {/* Menggunakan lg:flex-row agar pagination tidak bertumpuk dengan button di layar iPad */}
      <div className="px-4 py-4 sm:px-5 border-t border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50/30 rounded-b-xl w-full">
        <span className="text-xs sm:text-sm text-slate-500 w-full lg:w-auto text-center lg:text-left">
          Showing {table.getRowModel().rows.length} of {data.length} items
        </span>

        <div className="flex-1 w-full flex justify-center overflow-x-auto">
          <PaginationControls table={table} />
        </div>

        {footerAction && (
          <div className="w-full lg:w-auto flex justify-center lg:justify-end">
            {footerAction}
          </div>
        )}
      </div>
    </div>
  );
}
