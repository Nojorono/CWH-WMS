import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useStoreInventoryMovement } from "../../../DynamicAPI/stores/Store/MasterStore";
import MovementDetailView from "./MovementDetailView";
import { FaEdit, FaEye, FaPlus, FaTrash } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";

const InventoryMovement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const { fetchUsingPagination, list, updateData, pagination } =
    useStoreInventoryMovement();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;

  const [pageSize, setPageSize] = useState(20);
  const [selectedMovement, setSelectedMovement] = useState<any | null>(null);

  // ================= FETCH SERVER SIDE =================
  useEffect(() => {
    if (!fetchUsingPagination) return;

    fetchUsingPagination({
      page: currentPage,
      limit: pageSize,
      sortOrder: "DESC",
      sortBy: "progression_status",
    });
  }, [fetchUsingPagination, currentPage, pageSize]);

  // ================= HANDLE PAGE CHANGE =================
  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);

    if (newSize !== pageSize) setPageSize(newSize);
  };

  // ================= COLUMNS =================
  const columnHelper = createColumnHelper<any>();

  const columns = [
    columnHelper.accessor("movement_number", {
      header: "Move Location ID",
      cell: (info) => <span className="font-bold">{info.getValue()}</span>,
    }),
    columnHelper.accessor("createdAt", {
      header: "Create Date",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID"),
    }),
    columnHelper.accessor(
      (row) => row?.sourceWarehouseSub?.name ?? "",
      {
        id: "sourceWarehouseSub.name",
        header: "Source Zone",
      },
    ),
    columnHelper.accessor((row) => row?.sourceBin?.name ?? "", {
      id: "sourceBin.name",
      header: "Source Bin",
    }),
    columnHelper.accessor(
      (row) => row?.destinationWarehouseSub?.name ?? "",
      {
        id: "destinationWarehouseSub.name",
        header: "Destination Zone",
      },
    ),
    columnHelper.accessor((row) => row?.destinationBin?.name ?? "", {
      id: "destinationBin.name",
      header: "Destination Bin",
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
                    : info.getValue() === "CANCELLED"
                      ? "bg-red-100 text-red-700"
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
      cell: (info) => {
        const hasCompletedPallet =
          Array.isArray(info.row.original.pallets) &&
          info.row.original.pallets.some((p: any) => p.is_completed);

        if (info.row.original.status === "CANCELLED") {
          return (
            <FaEye
              className="inline mr-2 cursor-pointer text-green-600"
              onClick={() =>
                setSelectedMovement({
                  ...info.row.original,
                  viewOnly: true,
                })
              }
            />
          );
        }

        return (
          <>
            {info.row.original.status === "COMPLETED" ? (
              <FaEye
                className="inline mr-2 cursor-pointer text-green-600"
                onClick={() =>
                  setSelectedMovement({
                    ...info.row.original,
                    viewOnly: true,
                  })
                }
              />
            ) : (
              <>
                {(!info.row.original.users ||
                  info.row.original.users.length === 0) && (
                  <FaPlus
                    className="inline mr-2 cursor-pointer text-orange-600"
                    onClick={() =>
                      setSelectedMovement({
                        ...info.row.original,
                        addOnly: true,
                      })
                    }
                  />
                )}

                {info.row.original.users?.length > 0 && !hasCompletedPallet && (
                  <FaEdit
                    className="inline mr-2 cursor-pointer text-blue-600"
                    onClick={() =>
                      setSelectedMovement({
                        ...info.row.original,
                        editOnly: true,
                      })
                    }
                  />
                )}

                <FaEye
                  className="inline mr-2 cursor-pointer text-green-600"
                  onClick={() =>
                    setSelectedMovement({
                      ...info.row.original,
                      viewOnly: true,
                    })
                  }
                />

                {!hasCompletedPallet && (
                  <FaTrash
                    className="inline cursor-pointer text-red-600"
                    onClick={() => handleDelete(info.row.original.id)}
                  />
                )}
              </>
            )}
          </>
        );
      },
    }),
  ];

  // ================= TABLE =================
  const table = useReactTable({
    data: list || [],
    columns,
    pageCount: pagination?.totalPages ?? 0,
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
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

  // ================= DELETE =================
  const handleDelete = async (id: string) => {
    const Swal = (await import("sweetalert2")).default;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it!",
    });

    if (result.isConfirmed) {
      const payload = { status: "CANCELLED" };

      try {
        await updateData(id, payload as any);
      } catch {
        Swal.fire("Error", "Failed to cancel item.", "error");
      }
    }
  };

  // ================= DETAIL VIEW =================
  if (selectedMovement) {
    return (
      <MovementDetailView
        data={selectedMovement}
        onBack={() => setSelectedMovement(null)}
      />
    );
  }

  // ================= RENDER =================
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-orange-500 text-white text-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="p-3">
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

        {/* ================= PAGINATION ================= */}
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
              className="border rounded px-2 py-1 text-sm"
            >
              {[10, 20, 50, 100].map((size) => (
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

export default InventoryMovement;
