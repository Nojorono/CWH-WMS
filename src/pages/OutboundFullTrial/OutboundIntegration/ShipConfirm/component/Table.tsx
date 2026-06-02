import React, { useState, ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  Row,
} from "@tanstack/react-table";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";

interface ExpandableTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  pageIndex?: number;
  totalPages?: number;
  isLoading?: boolean;
  renderRowDetails: (row: Row<T>) => ReactNode;
}

const ExpandableTableComponent = <T extends { [key: string]: any }>({
  data,
  columns,
  globalFilter,
  setGlobalFilter,
  pageSize = 10,
  onPageChange,
  pageIndex = 0,
  totalPages = 1,
  isLoading = false,
  renderRowDetails,
}: ExpandableTableProps<T>) => {
  const [expanded, setExpanded] = useState({});

  const table = useReactTable<T>({
    data,
    columns,
    state: { globalFilter, expanded },
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  const handleGotoPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      onPageChange?.(page, pageSize);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden w-full font-sans">
      <div className="overflow-x-auto relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        )}

        <table className="min-w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-[#1e293b] text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      width: header.id === "expander" ? "50px" : "auto",
                    }}
                    className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows.map((row) => (
              <React.Fragment key={row.id}>
                <tr
                  className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${
                    row.getIsExpanded() ? "bg-blue-50/40" : ""
                  }`}
                  onClick={() => row.toggleExpanded()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-4 text-[13px] text-gray-700 border-b border-gray-50"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() && (
                  <tr>
                    <td
                      colSpan={table.getVisibleLeafColumns().length}
                      className="bg-slate-50 p-0 border-b border-slate-200 shadow-inner"
                    >
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        {renderRowDetails(row)}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-200">
        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">
          Total Pages: <b className="text-slate-800">{totalPages}</b>
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGotoPage(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-all"
          >
            <MdChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm text-xs font-bold text-blue-600">
            {pageIndex + 1}
          </div>
          <button
            onClick={() => handleGotoPage(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
            className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm disabled:opacity-30 hover:bg-gray-50 transition-all"
          >
            <MdChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpandableTableComponent;
