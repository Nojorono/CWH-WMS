import React, { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useStoreInventoryMovement } from "../../../DynamicAPI/stores/Store/MasterStore";
import MovementDetailView from "./MovementDetailView"; // Kita buat component ini di bawah

const InventoryMovement: React.FC = () => {
  const { fetchAll, list } = useStoreInventoryMovement();
  const [selectedMovement, setSelectedMovement] = useState<any | null>(null);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const columnHelper = createColumnHelper<any>();

  const columns = [
    columnHelper.accessor("movement_number", {
      header: "Move Location ID",
      cell: (info) => <span className="font-bold">{info.getValue()}</span>,
    }),
    columnHelper.accessor("createdAt", {
      header: "Date",
      cell: (info) => new Date(info.getValue()).toLocaleDateString("id-ID"),
    }),
    columnHelper.accessor("sourceWarehouseSub.name", {
      header: "Sumber",
    }),
    columnHelper.accessor("destinationWarehouseSub.name", {
      header: "Tujuan",
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "action",
      header: "Action",
      cell: (info) => (
        <button
          onClick={() => setSelectedMovement(info.row.original)}
          className="text-emerald-500 hover:bg-emerald-50 p-2 rounded-full transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      ),
    }),
  ];

  const table = useReactTable({
    data: list || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (selectedMovement) {
    console.log("Selected Movement:", selectedMovement);
    
    return (
      <MovementDetailView
        data={selectedMovement}
        onBack={() => setSelectedMovement(null)}
      />
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-indigo-900 mb-4">Move Location</h2>
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
      </div>
    </div>
  );
};

export default InventoryMovement;
