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
  pageIndex?: number; // controlled by parent
  totalPages?: number; // from parent (for API pagination)
  selectColumn?: boolean;
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
  selectColumn = true,
}: TableComponentProps<T>) => {
  // 🧭 Local pagination state (but controlled by parent)
  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize,
  });

  // 🧩 Sinkronisasi pageIndex & pageSize dari parent ke local
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex,
    }));
  }, [pageIndex]);

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageSize,
    }));
  }, [pageSize]);

  // 🔥 cari kolom dengan flag selectedRow
  const selectionColumn = columns.find((col: any) => col.selectedRow);

  const enhancedColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!selectionColumn) return columns;
    // Removed unused accessorKey declaration
    return [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
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

  // 🔄 Kirim ID terpilih ke parent
  useEffect(() => {
    if (onSelectionChange && selectionColumn) {
      const accessorKey = (selectionColumn as any).accessorKey;
      const selectedIds = table
        .getSelectedRowModel()
        .rows.map((row) => row.original[accessorKey]);
      onSelectionChange(selectedIds);
    }
  }, [table.getSelectedRowModel().rows, selectionColumn, onSelectionChange]);

  // 🌐 Custom pagination handler
  const handleGotoPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      setPagination((prev) => ({ ...prev, pageIndex: page }));
      onPageChange?.(page, pagination.pageSize);
    }
  };

  const handleNextPage = () => handleGotoPage(pagination.pageIndex + 1);
  const handlePrevPage = () => handleGotoPage(pagination.pageIndex - 1);

  const handlePageSizeChange = (size: number) => {
    setPagination({ ...pagination, pageSize: size, pageIndex: 0 });
    onPageChange?.(0, size);
  };

  return (
    <>
      {/* 🧱 Table */}
      <div className="overflow-x-auto">
        <div className="max-h-[600px] overflow-y-auto">
          <div className="mb-2">
            {selectColumn && (
              <select
                value={pagination.pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            )}
          </div>

          <table className="min-w-full table-auto border border-gray-200">
            <thead className="sticky top-0 bg-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2 border-b cursor-pointer text-left" // Changed to text-left
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getIsSorted() === "asc" && " 🔼"}
                      {header.column.getIsSorted() === "desc" && " 🔽"}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={enhancedColumns.length}
                    className="text-center py-4"
                  >
                    No data available
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2 border-b">
                        {cell.column.columnDef.cell
                          ? flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          : flexRender(
                              cell.getValue() as any,
                              cell.getContext()
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

      {/* 🧭 Custom Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm">
          Page {pagination.pageIndex + 1} of {totalPages}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={pagination.pageIndex === 0}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleGotoPage(idx)}
              className={`px-2 py-1 border rounded ${
                pagination.pageIndex === idx ? "bg-blue-500 text-white" : ""
              }`}
            >
              {idx + 1}
            </button>
          ))}

          <button
            onClick={handleNextPage}
            disabled={pagination.pageIndex >= totalPages - 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default TableComponent;
