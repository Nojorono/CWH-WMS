"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";

type DataTableProps<T extends object> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  pageSize?: number;
};

export default function DataTable<T extends object>({
  data,
  columns,
  pageSize = 10,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize,
      },
    },
  });

  return (
    <div className="p-2 sm:p-4 w-full min-w-0">
      <div className="w-full overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-orange-500 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs sm:text-sm whitespace-nowrap"
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
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-slate-50/50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-2 align-middle text-xs sm:text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — aligned with table width, responsive wrap */}
      <div className="mt-3 sm:mt-4 w-full min-w-0 rounded-lg border border-gray-200 bg-white p-3 sm:p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-orange-500 text-orange-500 rounded hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">⏮ </span>First
            </button>
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-orange-500 text-orange-500 rounded hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ◀ Prev
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-orange-500 text-orange-500 rounded hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next ▶
            </button>
            <button
              type="button"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-orange-500 text-orange-500 rounded hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last<span className="hidden sm:inline"> ⏭</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto text-xs sm:text-sm text-gray-700">
            <span className="whitespace-nowrap">
              Page{" "}
              <strong className="text-orange-600">
                {table.getState().pagination.pageIndex + 1} of{" "}
                {Math.max(table.getPageCount(), 1)}
              </strong>
            </span>

            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-gray-600 whitespace-nowrap">
                Rows:
              </label>
              <select
                id="pageSize"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border border-orange-500 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );}
