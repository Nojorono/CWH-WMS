"use client";

import React, { useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useStorePickingList } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { formatDateIndo } from "../../../../helper/FormatDate";
import ActIndicator from "../../../../components/ui/activityIndicator";
import {
  PickingListItem,
  PickingListResponse,
} from "../Helper/detailPickingList";

type Props = {
  open: boolean;
  onClose: () => void;
  memoId?: string; // ✅ kirim memoID langsung dari parent
};

function ModalPickingList({ open, onClose, memoId }: Props) {
  const { fetchById, detail, isLoading } = useStorePickingList();

  // 🔁 Fetch data setiap kali modal dibuka dan memoId ada
  useEffect(() => {
    if (open && memoId) {
      fetchById(memoId);
    }
  }, [open, memoId, fetchById]);

  const apiResponse = detail as unknown as PickingListResponse | undefined;

  // 🧠 Transform data API → table
  const data = useMemo(() => {
    if (!apiResponse) return [];
    return apiResponse.map((d) => ({
      id: d.id,
      doId: d.do?.id || "-",
      doNumber: d.do?.outbound_do_number || "-",
      doType: d.do?.outbound_type || "-",
      deliveryDate: formatDateIndo(d.do?.delivery_date) || "-",
      memoId: d.memo?.id || "-",
      memoDestination: d.memo?.destination || "-",
      itemId: d.item?.id || "-",
      itemSKU: d.item?.sku || "-",
      itemDescription: d.item?.description || "-",
      itemNumber: d.item?.item_number || "-",
      quantity: d.quantity,
      uom: d.uom,
      sourceSub: d.sourceWarehouseSub?.name || "-",
      sourceBin: d.sourceBin?.name || "-",
      status: d.status,
      destinationZone: d.destinationWarehouseSub?.name || "-",
      destinationBinName: d.destinationBin?.name || "-",
      memoNumber: d.memo?.outbound_memo_number || "-",
    }));
  }, [apiResponse]);

  const headerInfo = data[0] || {};

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "Item Number",
        accessorKey: "itemNumber",
      },
      {
        header: "Item Description",
        accessorKey: "itemDescription",
      },
      {
        header: "Qty Pick Plan",
        accessorKey: "quantity",
      },
      {
        header: "UOM",
        accessorKey: "uom",
      },
      {
        header: "Source Zone",
        accessorKey: "sourceSub",
      },
      {
        header: "Source Bin",
        accessorKey: "sourceBin",
      },
      {
        header: "Outbound Zone",
        accessorKey: "destinationZone",
      },
      {
        header: "Outbound Line",
        accessorKey: "destinationBinName",
      },
      {
        header: "Status",
        cell: (info) => {
          const status = info.row.original.status;
          const color =
            status === "COMPLETED"
              ? "bg-green-100 text-green-700"
              : status === "PENDING"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-gray-100 text-gray-700";
          return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${color}`}>
              {status}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-[98vw] max-w-[1300px] max-h-[96vh] overflow-y-auto rounded-xl shadow-lg relative">
        {/* 🔘 Header */}
        <div className="sticky top-0 bg-orange-500 text-white px-6 py-3 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-semibold">📦 Submitted Picking List</h2>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/40 text-white rounded-full p-1 px-3 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ⏳ Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center h-60 text-orange-500">
              <ActIndicator />
            </div>
          ) : (
            <>
              {/* 🪪 Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 shadow-sm p-4 rounded-lg border border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">DO ID</p>
                  <p className="font-medium text-gray-800">
                    {headerInfo.doId || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">DO Number</p>
                  <p className="font-medium text-gray-800">
                    {headerInfo.doNumber || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Memo Number</p>
                  <p className="font-medium text-gray-800">
                    {headerInfo.memoNumber || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Memo ID</p>
                  <p className="font-medium text-gray-800">
                    {headerInfo.memoId || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Outbound Type</p>
                  <p className="font-medium text-gray-800">
                    {headerInfo.doType || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivery Date</p>
                  <p className="font-medium text-gray-800">
                    {headerInfo.deliveryDate || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Destination</p>
                  <p className="font-medium text-gray-800">
                    {headerInfo.memoDestination || "-"}
                  </p>
                </div>
              </div>

              {/* 📋 Table */}
              <div className="overflow-x-auto bg-white shadow rounded-lg border border-gray-100">
                <table className="min-w-full border-collapse">
                  <thead className="bg-gray-50 border-b">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th
                            key={header.id}
                            className="text-left px-4 py-2 text-sm font-semibold text-gray-700 border-b"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <tr
                          key={row.id}
                          className="hover:bg-gray-50 transition-colors border-b"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="px-4 py-2 text-sm text-gray-700"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="text-center py-4 text-gray-500"
                        >
                          No picking list data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 🧡 Footer */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={onClose}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModalPickingList;
