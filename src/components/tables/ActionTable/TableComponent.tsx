import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

import {
  MdChevronLeft,
  MdChevronRight,
  MdFirstPage,
  MdLastPage,
} from "react-icons/md";

interface TableComponentProps<T> {
  data: T[];
  columns: (ColumnDef<T> & { selectedRow?: boolean })[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onSelectionChange?: (selectedIds: any[]) => void;
  pageSize?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  pageIndex?: number;
  totalPages?: number;
  isLoading?: boolean;
}

const TableComponent = <T extends { [key: string]: any }>({
  data,
  columns,
  globalFilter,
  setGlobalFilter,
  onSelectionChange,
  pageSize = 10,
  onPageChange,
  pageIndex = 0,
  totalPages = 1,
  isLoading = false,
}: TableComponentProps<T>) => {
  const [pagination, setPagination] = useState({ pageIndex, pageSize });

  useEffect(() => {
    setPagination({ pageIndex, pageSize });
  }, [pageIndex, pageSize]);

  const selectionColumn = columns.find((col: any) => col.selectedRow);

  const enhancedColumns = useMemo<ColumnDef<T>[]>(() => {
    const baseCols = columns.filter((col: any) => !col.selectedRow);
    if (!selectionColumn) return baseCols;

    return [
      {
        id: "select",
        // Mengunci lebar kolom checkbox agar tidak bergeser
        size: 50,
        header: ({ table }) => (
          <div className="flex items-center justify-center w-full">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center w-full">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
      },
      ...baseCols,
    ];
  }, [columns, selectionColumn]);

  const table = useReactTable<T>({
    data,
    columns: enhancedColumns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: !!selectionColumn,
  });

  useEffect(() => {
    if (onSelectionChange && selectionColumn) {
      const accessorKey = (selectionColumn as any).accessorKey;
      const selectedIds = table
        .getSelectedRowModel()
        .rows.map((row) => row.original[accessorKey]);
      onSelectionChange(selectedIds);
    }
  }, [table.getSelectedRowModel().rows, selectionColumn, onSelectionChange]);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const showMax = 5;
    if (totalPages <= showMax) {
      for (let i = 0; i < totalPages; i++) pages.push(i);
    } else {
      pages.push(0);
      if (pagination.pageIndex > 2) pages.push("...");
      const start = Math.max(1, pagination.pageIndex - 1);
      const end = Math.min(totalPages - 2, pagination.pageIndex + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (pagination.pageIndex < totalPages - 3) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages;
  };

  const handleGotoPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      onPageChange?.(page, pagination.pageSize);
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden w-full">
      <div className="overflow-x-auto relative">
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
              <span className="mt-2 text-sm font-semibold text-gray-600">
                Loading data...
              </span>
            </div>
          </div>
        )}

        <div className="max-h-[650px] overflow-y-auto">
          <table className="min-w-full table-fixed divide-y divide-gray-200">
            <thead className="sticky top-0 z-10 shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-orange-500 text-white">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      // Menambahkan width dinamis dari konfigurasi kolom
                      style={{
                        width: header.id === "select" ? "50px" : "auto",
                      }}
                      className={`px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap bg-orange-500 text-white ${
                        header.column.getCanSort()
                          ? "cursor-pointer hover:bg-orange-600"
                          : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-[10px] w-4">
                            {{ asc: " 🔼", desc: " 🔽" }[
                              header.column.getIsSorted() as string
                            ] ?? ""}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {table.getRowModel().rows.length === 0 && !isLoading ? (
                <tr>
                  <td
                    colSpan={enhancedColumns.length}
                    className="px-6 py-20 text-center text-gray-400 italic font-medium"
                  >
                    No data available.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-orange-50/50 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        // Pastikan padding dan alignment SAMA dengan header
                        className="px-4 py-4 text-[13px] text-gray-700 border-b border-gray-50 align-middle"
                      >
                        <div className="w-full">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination (Tetap Sama) */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Show
            </span>
            <select
              value={pagination.pageSize}
              onChange={(e) => onPageChange?.(0, Number(e.target.value))}
              className="bg-white border border-gray-300 text-gray-700 text-xs rounded-md focus:ring-orange-500 focus:border-orange-500 block p-1 shadow-sm outline-none cursor-pointer"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500">
            Page{" "}
            <span className="font-bold text-gray-900">
              {pagination.pageIndex + 1}
            </span>{" "}
            of <span className="font-bold text-gray-900">{totalPages}</span>
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleGotoPage(0)}
            disabled={pagination.pageIndex === 0}
            className="p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm"
          >
            <MdFirstPage className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleGotoPage(pagination.pageIndex - 1)}
            disabled={pagination.pageIndex === 0}
            className="p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm"
          >
            <MdChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((num: number | string, idx: number) => (
              <button
                key={idx}
                onClick={() => typeof num === "number" && handleGotoPage(num)}
                disabled={typeof num !== "number"}
                className={`w-8 h-8 text-xs font-bold rounded-md transition-all ${
                  pagination.pageIndex === num
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                    : num === "..."
                      ? "text-gray-400 cursor-default"
                      : "text-gray-600 hover:bg-orange-100 hover:text-orange-600"
                }`}
              >
                {typeof num === "number" ? num + 1 : num}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGotoPage(pagination.pageIndex + 1)}
            disabled={pagination.pageIndex >= totalPages - 1}
            className="p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm"
          >
            <MdChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleGotoPage(totalPages - 1)}
            disabled={pagination.pageIndex >= totalPages - 1}
            className="p-1 rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm"
          >
            <MdLastPage className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableComponent;
