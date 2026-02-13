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
//                             header.getContext()
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
//                               cell.getContext()
//                             )
//                           : flexRender(
//                               cell.getValue() as any,
//                               cell.getContext()
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
    <div className="flex flex-col w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      {/* 🚀 Top Bar: Page Size Selector (Fixed & Sticky) */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-30 sticky top-0">
        <div className="flex items-center gap-3">
          {/* <label className="text-sm font-semibold text-gray-600">
            Tampilkan
          </label> */}
          <div className="relative">
            <select
              value={pagination.pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="appearance-none bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 block px-4 py-2 pr-8 transition-all outline-none font-bold cursor-pointer hover:bg-gray-100"
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size} Baris
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

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
