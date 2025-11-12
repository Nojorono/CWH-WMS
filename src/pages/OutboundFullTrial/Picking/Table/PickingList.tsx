"use client";
import React, { useEffect, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { useLocation } from "react-router";
import { useStorePickingList } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { formatDateIndo } from "../../../../helper/FormatDate";

interface PickingListItem {
  id: string;
  destination_warehouse_sub_id: string;
  do: {
    id: string;
    outbound_do_number: string;
    outbound_type: string;
    delivery_date: string;
  };
  memo: {
    id: string;
    requestor: string;
    destination: string;
  };
  item: {
    id: string;
    sku: string;
    description: string;
  };
  sourceWarehouseSub: {
    id: string;
    name: string;
  };
  sourceBin: {
    id: string;
    name: string;
  } | null;
  quantity: number;
  uom: string;
  status: string;
}

interface PickingListResponse {
  success: boolean;
  message: string;
  data: PickingListItem[];
}

function PickingList() {
  const location = useLocation();
  const { data: memoID } = location.state || {};
  const { fetchById, detail } = useStorePickingList();

  useEffect(() => {
    if (memoID) fetchById(memoID);
  }, [fetchById, memoID]);

  const apiResponse = detail as unknown as PickingListResponse | undefined;

  // 🧠 Map data dari API ke struktur siap tampil
  const data = useMemo(() => {
    if (!apiResponse?.data) return [];
    return apiResponse.data.map((d) => ({
      id: d.id,
      doId: d.do?.id || "-",
      doType: d.do?.outbound_type || "-",
      deliveryDate: formatDateIndo(d.do?.delivery_date) || "-",
      memoId: d.memo?.id || "-",
      memoDestination: d.memo?.destination || "-",
      itemSKU: d.item?.sku || "-",
      itemDescription: d.item?.description || "-",
      quantity: d.quantity,
      uom: d.uom,
      sourceSub: d.sourceWarehouseSub?.name || "-",
      sourceBin: d.sourceBin?.name || "-",
      status: d.status,
      destination_warehouse_sub_id: d.destination_warehouse_sub_id,
    }));
  }, [apiResponse]);

  // Ambil informasi header dari item pertama
  const headerInfo = data[0] || {};

  // 🧱 Kolom table
  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        header: "Item",
        cell: (info) =>
          `${info.row.original.itemSKU} - ${info.row.original.itemDescription}`,
      },
      {
        header: "Qty Pick",
        accessorKey: "quantity",
      },
      {
        header: "UOM",
        accessorKey: "uom",
      },
      {
        header: "Source Sub",
        accessorKey: "sourceSub",
      },
      {
        header: "Source Bin",
        accessorKey: "sourceBin",
      },
      {
        header: "Outbound Line",
        accessorKey: "destination_warehouse_sub_id",
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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">📦 Picking List</h1>

      {/* 🪪 Info Card Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-white shadow p-4 rounded-lg border border-gray-100">
        <div>
          <p className="text-sm text-gray-500">DO ID</p>
          <p className="font-medium text-gray-800">{headerInfo.doId || "-"}</p>
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

      {/* 📋 Table Section */}
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
    </div>
  );
}

export default PickingList;
