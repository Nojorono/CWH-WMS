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
  // 🧭 Sinkronisasi local state hanya untuk memicu render yang halus
  const [pagination, setPagination] = useState({ pageIndex, pageSize });

  useEffect(() => {
    setPagination({ pageIndex, pageSize });
  }, [pageIndex, pageSize]);

  // 🔥 Logika kolom seleksi (Checkbox)
  const selectionColumn = columns.find((col: any) => col.selectedRow);

  const enhancedColumns = useMemo<ColumnDef<T>[]>(() => {
    const baseCols = columns.filter((col: any) => !col.selectedRow);
    if (!selectionColumn) return baseCols;

    return [
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
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

  // 🔄 Callback untuk seleksi baris
  useEffect(() => {
    if (onSelectionChange && selectionColumn) {
      const accessorKey = (selectionColumn as any).accessorKey;
      const selectedIds = table
        .getSelectedRowModel()
        .rows.map((row) => row.original[accessorKey]);
      onSelectionChange(selectedIds);
    }
  }, [table.getSelectedRowModel().rows, selectionColumn, onSelectionChange]);

  // 🧠 Logika Pagination Modern (dengan Truncation)
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
    <div className="flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* 🧱 Table Area */}
      <div className="overflow-x-auto relative min-h-[300px]">
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

        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <table className="min-w-full divide-y divide-gray-200 table-fixed sm:table-auto">
            <thead className="sticky top-0 z-10 bg-orange-500 text-white shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-orange-600 transition-colors"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <span className="text-[10px]">
                          {{ asc: " 🔼", desc: " 🔽" }[
                            header.column.getIsSorted() as string
                          ] ?? ""}
                        </span>
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
                    className="px-6 py-20 text-center text-gray-400 italic"
                  >
                    No data available in this warehouse.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-orange-50 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-3.5 text-sm text-gray-700 whitespace-nowrap"
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

      {/* 🧭 Modern Pagination Controls */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Metadata */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Show
            </span>
            <select
              value={pagination.pageSize}
              onChange={(e) => onPageChange?.(0, Number(e.target.value))}
              className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500 block p-1.5 shadow-sm outline-none"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500">
            Page{" "}
            <span className="font-semibold text-gray-900">
              {pagination.pageIndex + 1}
            </span>{" "}
            of <span className="font-semibold text-gray-900">{totalPages}</span>
          </p>
        </div>

        {/* Right: Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleGotoPage(0)}
            disabled={pagination.pageIndex === 0}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm"
          >
            <MdFirstPage className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleGotoPage(pagination.pageIndex - 1)}
            disabled={pagination.pageIndex === 0}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm"
          >
            <MdChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1 mx-1">
            {getPageNumbers().map((num, idx) => (
              <button
                key={idx}
                onClick={() => typeof num === "number" && handleGotoPage(num)}
                className={`w-9 h-9 text-sm font-medium rounded-lg transition-all ${
                  pagination.pageIndex === num
                    ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                    : num === "..."
                      ? "text-gray-400 cursor-default"
                      : "text-gray-600 hover:bg-gray-100"
                }`}
                disabled={typeof num !== "number"}
              >
                {typeof num === "number" ? num + 1 : num}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleGotoPage(pagination.pageIndex + 1)}
            disabled={pagination.pageIndex >= totalPages - 1}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm"
          >
            <MdChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleGotoPage(totalPages - 1)}
            disabled={pagination.pageIndex >= totalPages - 1}
            className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-all shadow-sm"
          >
            <MdLastPage className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableComponent;

// import { useState, useMemo, useEffect } from "react";
// import {
//   useReactTable,
//   getCoreRowModel,
//   getFilteredRowModel,
//   getSortedRowModel,
//   flexRender,
//   ColumnDef,
// } from "@tanstack/react-table";

// interface TableComponentProps<T> {
//   data: T[];
//   columns: (ColumnDef<T> & { selectedRow?: boolean })[];
//   globalFilter?: string;
//   setGlobalFilter?: (value: string) => void;
//   onSelectionChange?: (selectedIds: any[]) => void;
//   pageSize?: number;
//   onDetail?: (id: any) => void;
//   onPageChange?: (page: number, pageSize: number) => void;
//   pageIndex?: number; // controlled by parent
//   totalPages?: number; // from parent (for API pagination)
// }

// const TableComponent = <T extends { [key: string]: any }>({
//   data,
//   columns,
//   globalFilter,
//   setGlobalFilter,
//   onSelectionChange,
//   pageSize = 10,
//   onPageChange,
//   pageIndex = 0,
//   totalPages = 1,
// }: TableComponentProps<T>) => {
//   // 🧭 Local pagination state (but controlled by parent)
//   const [pagination, setPagination] = useState({
//     pageIndex,
//     pageSize,
//   });

//   // 🧩 Sinkronisasi pageIndex & pageSize dari parent ke local
//   useEffect(() => {
//     setPagination((prev) => ({
//       ...prev,
//       pageIndex,
//     }));
//   }, [pageIndex]);

//   useEffect(() => {
//     setPagination((prev) => ({
//       ...prev,
//       pageSize,
//     }));
//   }, [pageSize]);

//   // 🔥 cari kolom dengan flag selectedRow
//   const selectionColumn = columns.find((col: any) => col.selectedRow);

//   const enhancedColumns = useMemo<ColumnDef<T>[]>(() => {
//     if (!selectionColumn) return columns;
//     // Removed unused accessorKey declaration
//     return [
//       {
//         id: "select",
//         header: ({ table }) => (
//           <input
//             type="checkbox"
//             checked={table.getIsAllPageRowsSelected()}
//             onChange={table.getToggleAllPageRowsSelectedHandler()}
//           />
//         ),
//         cell: ({ row }) => (
//           <input
//             type="checkbox"
//             checked={row.getIsSelected()}
//             disabled={!row.getCanSelect()}
//             onChange={row.getToggleSelectedHandler()}
//           />
//         ),
//       },
//       ...columns.filter((col: any) => !col.selectedRow),
//     ];
//   }, [columns, selectionColumn]);

//   const table = useReactTable<T>({
//     data,
//     columns: enhancedColumns,
//     state: { globalFilter },
//     onGlobalFilterChange: setGlobalFilter,
//     getCoreRowModel: getCoreRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     enableRowSelection: !!selectionColumn,
//   });

//   // 🔄 Kirim ID terpilih ke parent
//   useEffect(() => {
//     if (onSelectionChange && selectionColumn) {
//       const accessorKey = (selectionColumn as any).accessorKey;
//       const selectedIds = table
//         .getSelectedRowModel()
//         .rows.map((row) => row.original[accessorKey]);
//       onSelectionChange(selectedIds);
//     }
//   }, [table.getSelectedRowModel().rows, selectionColumn, onSelectionChange]);

//   // 🌐 Custom pagination handler
//   const handleGotoPage = (page: number) => {
//     if (page >= 0 && page < totalPages) {
//       setPagination((prev) => ({ ...prev, pageIndex: page }));
//       onPageChange?.(page, pagination.pageSize);
//     }
//   };

//   const handleNextPage = () => handleGotoPage(pagination.pageIndex + 1);
//   const handlePrevPage = () => handleGotoPage(pagination.pageIndex - 1);

//   const handlePageSizeChange = (size: number) => {
//     setPagination({ ...pagination, pageSize: size, pageIndex: 0 });
//     onPageChange?.(0, size);
//   };

//   return (
//     <>
//       {/* 🧱 Table */}
//       <div className="overflow-x-auto">
//         <div className="max-h-[600px] overflow-y-auto">
//           <div className="mb-2">
//             <select
//               value={pagination.pageSize}
//               onChange={(e) => handlePageSizeChange(Number(e.target.value))}
//               className="border rounded px-2 py-1"
//             >
//               {[5, 10, 20, 50].map((size) => (
//                 <option key={size} value={size}>
//                   {size} / page
//                 </option>
//               ))}
//             </select>
//           </div>

//           <table className="min-w-full table-auto border border-gray-200">
//             <thead className="sticky top-0 bg-orange-500 text-white text-sm">
//               {table.getHeaderGroups().map((headerGroup) => (
//                 <tr key={headerGroup.id}>
//                   {headerGroup.headers.map((header) => (
//                     <th
//                       key={header.id}
//                       className="px-4 py-2 border-b cursor-pointer text-left" // Changed to text-left
//                       onClick={header.column.getToggleSortingHandler()}
//                     >
//                       {header.isPlaceholder
//                         ? null
//                         : flexRender(
//                             header.column.columnDef.header,
//                             header.getContext(),
//                           )}
//                       {header.column.getIsSorted() === "asc" && " 🔼"}
//                       {header.column.getIsSorted() === "desc" && " 🔽"}
//                     </th>
//                   ))}
//                 </tr>
//               ))}
//             </thead>
//             <tbody>
//               {table.getRowModel().rows.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={enhancedColumns.length}
//                     className="text-center py-4"
//                   >
//                     No data available
//                   </td>
//                 </tr>
//               ) : (
//                 table.getRowModel().rows.map((row) => (
//                   <tr key={row.id} className="hover:bg-gray-50">
//                     {row.getVisibleCells().map((cell) => (
//                       <td key={cell.id} className="px-4 py-2 border-b">
//                         {cell.column.columnDef.cell
//                           ? flexRender(
//                               cell.column.columnDef.cell,
//                               cell.getContext(),
//                             )
//                           : flexRender(
//                               cell.getValue() as any,
//                               cell.getContext(),
//                             )}
//                       </td>
//                     ))}
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* 🧭 Custom Pagination Controls */}
//       <div className="flex justify-between items-center mt-4">
//         <div className="text-sm">
//           Page {pagination.pageIndex + 1} of {totalPages}
//         </div>

//         <div className="flex items-center space-x-2">
//           <button
//             onClick={handlePrevPage}
//             disabled={pagination.pageIndex === 0}
//             className="px-3 py-1 border rounded disabled:opacity-50"
//           >
//             Prev
//           </button>

//           {Array.from({ length: totalPages }).map((_, idx) => (
//             <button
//               key={idx}
//               onClick={() => handleGotoPage(idx)}
//               className={`px-2 py-1 border rounded ${
//                 pagination.pageIndex === idx ? "bg-blue-500 text-white" : ""
//               }`}
//             >
//               {idx + 1}
//             </button>
//           ))}

//           <button
//             onClick={handleNextPage}
//             disabled={pagination.pageIndex >= totalPages - 1}
//             className="px-3 py-1 border rounded disabled:opacity-50"
//           >
//             Next
//           </button>
//         </div>
//       </div>
//     </>
//   );
// };

// export default TableComponent;
