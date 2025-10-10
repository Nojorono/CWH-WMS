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
  inventory_status: string;
  inventory_note: string;
  progression_status?: string;
};

export default function MovementHistoryTable({ palletId }: { palletId?: any }) {
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

        console.log("Fetched movement history:", inventory);

        // Kamu bisa mapping sesuai dengan struktur backend (sementara dummy 1 baris)
        const mapped: MovementRecord[] = [
          {
            datetime: new Date(inventory.inventory_date).toLocaleString(),
            action: "Received",
            warehouse: inventory.warehouse?.name || "-",
            zone: inventory.warehouseSub?.code || "-",
            bin: inventory.warehouseBin?.code || "-",
            inventory_status: inventory.inventory_status || "-",
            inventory_note: inventory.inventory_note || "-",
            progression_status: inventory.progression_status || "-",
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
        header: "Inventory Status",
        accessorKey: "inventory_status",
      },
      {
        header: "Inventory Note",
        accessorKey: "inventory_note",
      },
      {
        header: "Progression Status",
        accessorKey: "progression_status",
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
