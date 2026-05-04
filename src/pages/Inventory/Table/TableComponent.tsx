import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

interface TableComponentProps<T> {
  data: T[];
  columns: (ColumnDef<T> & { selectedRow?: boolean })[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onSelectionChange?: (selectedIds: any[]) => void;
  pageSize?: number;
  onDetail?: (id: any) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  pageIndex?: number;
  totalPages?: number;
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
}: TableComponentProps<T>) => {
  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize,
  });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex }));
  }, [pageIndex]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize }));
  }, [pageSize]);

  const selectionColumn = columns.find((col: any) => col.selectedRow);

  const enhancedColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!selectionColumn) return columns;
    return [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex justify-center items-center">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer transition-all"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center items-center">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer transition-all"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
      },
      ...columns.filter((col: any) => !col.selectedRow),
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

  const handleGotoPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      onPageChange?.(page, pagination.pageSize);
    }
  };

  const handlePageSizeChange = (size: number) => {
    onPageChange?.(0, size);
  };

  return (
    <div className="flex flex-col w-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 🧱 Table Container */}
      <div className="overflow-x-auto relative custom-scrollbar">
        <div className="max-h-[550px] overflow-y-auto">
          <table className="min-w-full table-fixed border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="px-6 py-4 bg-orange-500 text-left text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all border-b border-orange-400/30 first:rounded-tl-none last:rounded-tr-none"
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        <span className="text-orange-200 opacity-80">
                          {header.column.getIsSorted() === "asc"
                            ? " 🔼"
                            : header.column.getIsSorted() === "desc"
                              ? " 🔽"
                              : ""}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={enhancedColumns.length}
                    className="text-center py-24"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-gray-50 rounded-full">
                        <svg
                          className="w-12 h-12 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm font-medium italic">
                        Data tidak ditemukan...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-orange-50/20 transition-all duration-150"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 text-sm text-gray-700 border-b border-gray-50 whitespace-nowrap group-last:border-none"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🧭 Pagination Controls */}
      <div className="p-5 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm font-medium text-gray-500">
          Halaman{" "}
          <span className="text-orange-600 font-extrabold">
            {pagination.pageIndex + 1}
          </span>{" "}
          dari{" "}
          <span className="text-gray-900 font-extrabold">{totalPages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGotoPage(pagination.pageIndex - 1)}
            disabled={pagination.pageIndex === 0}
            className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
          >
            ← Prev
          </button>

          <div className="hidden md:flex items-center gap-1.5 mx-2">
            {Array.from({ length: totalPages }).map((_, idx) => {
              // Limit visible pages
              if (
                idx < pagination.pageIndex - 2 ||
                idx > pagination.pageIndex + 2
              )
                return null;
              return (
                <button
                  key={idx}
                  onClick={() => handleGotoPage(idx)}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-black transition-all ${
                    pagination.pageIndex === idx
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-200 scale-110"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handleGotoPage(pagination.pageIndex + 1)}
            disabled={pagination.pageIndex >= totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all active:scale-95"
          >
            Next →
          </button>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 2px solid #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default TableComponent;
