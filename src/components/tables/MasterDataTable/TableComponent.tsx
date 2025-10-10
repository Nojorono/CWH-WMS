import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import PaginationControls from "./Pagination";

interface TableComponentProps<T> {
  data: T[];
  columns: (ColumnDef<T> & { selectedRow?: boolean })[]; // 👈 custom flag
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onSelectionChange?: (selectedIds: any[]) => void;
  pageSize?: number;
  onDetail?: (id: any) => void;
}

const TableComponent = <T extends { [key: string]: any }>({
  data,
  columns,
  globalFilter,
  setGlobalFilter,
  onSelectionChange,
  pageSize,
  onDetail,
}: TableComponentProps<T>) => {
  const [pagination, setPagination] = useState(() => ({
    pageIndex: 0,
    pageSize: pageSize ?? 20,
  }));

  // 🔥 cari kolom yang punya flag selectedRow
  const selectionColumn = columns.find((col: any) => col.selectedRow);

  const enhancedColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!selectionColumn) return columns;
    const accessorKey = (selectionColumn as any).accessorKey;
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
      // ⬇️ filter supaya kolom selectedRow TIDAK dirender
      ...columns.filter((col: any) => !col.selectedRow),
    ];
  }, [columns, selectionColumn]);

  const table = useReactTable<T>({
    data,
    columns: enhancedColumns,
    state: {
      globalFilter,
      pagination,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: !!selectionColumn, // 👈 aktif kalau ada selectedRow
  });

  // 🔥 kirimkan ID terpilih ke parent
  useEffect(() => {
    if (onSelectionChange && selectionColumn) {
      const accessorKey = (selectionColumn as any).accessorKey;
      const selectedIds = table
        .getSelectedRowModel()
        .rows.map((row) => row.original[accessorKey]);
      onSelectionChange(selectedIds);
    }
  }, [table.getSelectedRowModel().rows, selectionColumn, onSelectionChange]);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="max-h-[600px] overflow-y-auto">
          <table className="min-w-full table-auto border border-gray-200">
            <thead className="sticky top-0 bg-gray-100">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="text-left">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-2 border-b cursor-pointer"
                      style={{ textAlign: "left" }}
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
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50"
                  style={{ textAlign: "left" }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 border-b">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        pageIndex={table.getState().pagination.pageIndex}
        pageSize={table.getState().pagination.pageSize}
        pageCount={table.getPageCount()}
        setPageSize={(size) =>
          setPagination((prev) => ({ ...prev, pageSize: size }))
        }
        previousPage={table.previousPage}
        nextPage={table.nextPage}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
        selectedRowCount={table.getSelectedRowModel().rows.length}
        totalDataCount={data.length}
        gotoPage={(page: number) =>
          setPagination((prev) => ({ ...prev, pageIndex: page }))
        }
      />
    </>
  );
};

export default TableComponent;
