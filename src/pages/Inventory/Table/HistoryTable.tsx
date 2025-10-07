"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import axios from "axios";
import { EndPoint } from "../../../utils/EndPoint";

type MovementRecord = {
  datetime: string;
  action: string;
  warehouse: string;
  zone: string;
  bin: string;
  staff: string;
  reason: string;
};


export default function MovementHistoryTable({
  palletId,
}: {
  palletId: string;
}) {
  const [data, setData] = useState<MovementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🟢 Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      if (!palletId) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${EndPoint}inventory-tracking/history/${palletId}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );
        const inventory = res.data.data;

        // Kamu bisa mapping sesuai dengan struktur backend (sementara dummy 1 baris)
        const mapped: MovementRecord[] = [
          {
            datetime: new Date(inventory.inventory_date).toLocaleString(),
            action: "Received",
            warehouse: inventory.warehouse?.name || "-",
            zone: inventory.warehouseSub?.code || "-",
            bin: inventory.warehouseBin?.code || "-",
            staff: "WH Staff 1",
            reason: "Good Received",
          },
        ];

        setData(mapped);
      } catch (err) {
        console.error("Error fetching movement history:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [palletId]);

  // 🟢 Column definition
  const columns = useMemo<ColumnDef<MovementRecord>[]>(
    () => [
      {
        header: "Date/Time",
        accessorKey: "datetime",
      },
      {
        header: "Action",
        accessorKey: "action",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          const color =
            val === "In Inventory"
              ? "bg-blue-100 text-blue-700"
              : val === "Movement"
              ? "bg-orange-100 text-orange-700"
              : val === "Put Away"
              ? "bg-green-100 text-green-700"
              : val === "Received"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-700";
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}
            >
              {val}
            </span>
          );
        },
      },
      {
        header: "Warehouse",
        accessorKey: "warehouse",
      },
      {
        header: "Zone",
        accessorKey: "zone",
      },
      {
        header: "Bin",
        accessorKey: "bin",
      },
      {
        header: "Staff",
        accessorKey: "staff",
      },
      {
        header: "Reason",
        accessorKey: "reason",
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h2 className="text-md font-semibold mb-3 border-l-4 border-orange-500 pl-2">
        Movement History
      </h2>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading data...</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-orange-500 text-white text-sm">
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-3 py-2 text-left">
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
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center text-sm text-gray-500 py-3"
                >
                  No data found
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b text-sm">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
