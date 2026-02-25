import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useStoreStockAdjustment } from "../../../DynamicAPI/stores/Store/MasterStore";
import { useSearchParams } from "react-router-dom";
import DetailView from "./DetailView";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";

const StockAdjustment: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchUsingPagination, list, pagination, deleteData } =
    useStoreStockAdjustment();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(5);

  // State untuk kontrol Mode
  const [showDetail, setShowDetail] = useState(false);
  const [viewMode, setViewMode] = useState<"create" | "detail" | "update">(
    "create",
  );
  const [selectedData, setSelectedData] = useState<any>(null);

  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: currentPage,
      limit: pageSize,
      sortOrder: "DESC",
    });
  }, [fetchUsingPagination, currentPage, pageSize]);

  const columnHelper = createColumnHelper<any>();

  const columns = [
    columnHelper.accessor("code", {
      header: "Adjustment Code",
      cell: (info) => (
        <span className="font-bold text-blue-600">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Create Date",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID"),
    }),
    columnHelper.accessor("type", {
      header: "Type",
      cell: (info) => (
        <span className="capitalize">{info.getValue()?.replace("_", " ")}</span>
      ),
    }),
    columnHelper.accessor("adjustmentStockItems", {
      id: "location",
      header: "Zone / Bin",
      cell: (info) => {
        const firstItem = info.getValue()?.[0];
        if (!firstItem) return "-";
        return `${firstItem.warehouseSub?.name ?? "-"} / ${firstItem.warehouseBin?.name ?? "-"}`;
      },
    }),
    columnHelper.accessor("adjustmentStockItems", {
      id: "item_info",
      header: "Item & Qty",
      cell: (info) => {
        const items = info.getValue();
        if (!items || items.length === 0) return "-";
        const firstItem = items[0];
        return (
          <div>
            <div className="text-xs font-semibold">{firstItem.item?.sku}</div>
            <div className="text-gray-500 text-[10px]">
              {firstItem.quantity} {firstItem.uom}
              {items.length > 1 && ` (+${items.length - 1} more)`}
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold
            ${
              info.getValue() === "PENDING"
                ? "bg-yellow-100 text-yellow-700"
                : info.getValue() === "APPROVED"
                  ? "bg-blue-100 text-blue-700"
                  : info.getValue() === "COMPLETED"
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
            }
          `}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "action",
      header: "Action",
      cell: (info) => (
        <div className="flex gap-2">
          {/* <button
            onClick={() => {
              setSelectedData(info.row.original);
              setViewMode("detail");
              setShowDetail(true);
            }}
            className="text-orange-600 hover:text-orange-800 font-medium text-xs underline"
          >
            View
          </button> */}

          {/* {info.row.original.status === "PENDING" && (
            <button
              onClick={() => {
                setSelectedData(info.row.original);
                setViewMode("update");
                setShowDetail(true);
              }}
              className="text-blue-600 hover:text-blue-800 font-medium text-xs underline"
            >
              Edit
            </button>
          )} */}

          <FaEye
            className="text-blue-600 hover:text-blue-800 font-medium text-xs underline"
            title="View"
            onClick={() => {
              setSelectedData(info.row.original);
              setViewMode("detail");
              setShowDetail(true);
            }}
          />

          {/* <FaEdit
            className={`text-green-600 hover:text-green-800 cursor-pointer ${info.row.original.status !== "PENDING" ? "opacity-50 cursor-not-allowed" : ""}`}
            title="Edit"
            onClick={() => {
              if (info.row.original.status !== "PENDING") return;
              setSelectedData(info.row.original);
              setViewMode("update");
              setShowDetail(true);
            }}
          />

          <FaTrash
            className={`text-red-600 hover:text-red-800 cursor-pointer ${info.row.original.status !== "PENDING" ? "opacity-50 cursor-not-allowed" : ""}`}
            title="Delete"
            onClick={() => {
              handleDelete(info.row.original.id);
            }}
          /> */}
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: list || [],
    columns,
    pageCount: pagination?.totalPages ?? 0,
    state: { pagination: { pageIndex, pageSize } },
    manualPagination: true,
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      handlePageChange(newPagination.pageIndex, newPagination.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);
    if (newSize !== pageSize) setPageSize(newSize);
  };

  const handleCreate = () => {
    setSelectedData(null);
    setViewMode("create");
    setShowDetail(true);
  };

  const handleDelete = (id: string) => {    
    deleteData(id);
  };

  if (showDetail) {
    return (
      <DetailView
        mode={viewMode}
        initialData={selectedData}
        onBack={() => setShowDetail(false)}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-end justify-end mb-1">
        <button
          onClick={handleCreate}
          className="mb-4 bg-[#ff6b00] hover:bg-[#e66000] text-white font-bold py-2 px-6 rounded-md transition-colors shadow-sm"
        >
          Create Stock Adjustment
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-orange-500 text-white text-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-3 font-medium border-r border-orange-400 last:border-0"
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
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-3 text-sm text-gray-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination logic remains the same... */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t">
          <div className="text-sm text-gray-600">
            Page {pageIndex + 1} of {pagination?.totalPages ?? 1}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50"
            >
              Next
            </button>
            <select
              value={pageSize}
              onChange={(e) =>
                handlePageChange(pageIndex, Number(e.target.value))
              }
              className="ml-2 border rounded px-2 py-1 text-sm"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  Show {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustment;
