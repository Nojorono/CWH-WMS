import React from "react";
import { Table } from "@tanstack/react-table";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export function PaginationControls<TData>({ table }: { table: Table<TData> }) {
  return (
    <div className="flex items-center gap-4">
      {/* Select Page Size */}
      <select
        className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-orange-500"
        value={table.getState().pagination.pageSize}
        onChange={(e) => table.setPageSize(Number(e.target.value))}
      >
        {[5, 10, 20, 30, 40, 50].map((size) => (
          <option key={size} value={size}>
            Show {size}
          </option>
        ))}
      </select>

      {/* Navigasi */}
      <div className="flex items-center gap-1">
        <button
          className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <FaChevronLeft size={12} />
        </button>
        <span className="text-xs font-medium">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
        <button
          className="p-2 rounded-md hover:bg-slate-100 disabled:opacity-50"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <FaChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}
