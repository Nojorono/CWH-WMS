// src/pages/inbound/PutAwayDetail.tsx
import React from "react";
import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { FaEye, FaCheck, FaEdit } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";

type Pallet = {
  palletId: string;
  totalSku: number;
  totalQty: number;
  staging: string;
  suggestZone: string;
  suggestBin: string;
  driver: string;
};

const palletData: Pallet[] = [
  {
    palletId: "P1",
    totalSku: 3,
    totalQty: 120,
    staging: "Stag-1",
    suggestZone: "-",
    suggestBin: "-",
    driver: "Hari",
  },
  {
    palletId: "P2",
    totalSku: 3,
    totalQty: 120,
    staging: "Stag-1",
    suggestZone: "-",
    suggestBin: "-",
    driver: "Hari",
  },
  {
    palletId: "P3",
    totalSku: 3,
    totalQty: 120,
    staging: "Stag-1",
    suggestZone: "-",
    suggestBin: "-",
    driver: "Hari",
  },
  {
    palletId: "P4",
    totalSku: 3,
    totalQty: 120,
    staging: "Stag-1",
    suggestZone: "-",
    suggestBin: "-",
    driver: "Hari",
  },
  {
    palletId: "P5",
    totalSku: 3,
    totalQty: 120,
    staging: "Stag-2",
    suggestZone: "-",
    suggestBin: "-",
    driver: "Hari",
  },
  {
    palletId: "P6",
    totalSku: 3,
    totalQty: 120,
    staging: "Stag-2",
    suggestZone: "-",
    suggestBin: "-",
    driver: "Hari",
  },
];

const PutAwayDetail: React.FC = () => {
  const columns = useMemo<ColumnDef<Pallet>[]>(
    () => [
      { accessorKey: "palletId", header: "Pallet ID" },
      { accessorKey: "totalSku", header: "Total SKU" },
      { accessorKey: "totalQty", header: "Total Qty" },
      { accessorKey: "staging", header: "Staging Area" },
      { accessorKey: "suggestZone", header: "Suggest Zone" },
      { accessorKey: "suggestBin", header: "Suggest Bin" },
      { accessorKey: "driver", header: "Forklift Driver" },
    ],
    []
  );

  const table = useReactTable({
    data: palletData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div>
        <h1 className="text-xl font-bold text-indigo-800">Put Away</h1>
        <p className="text-sm text-orange-500">
          Put Away &gt; Put Away List &gt; Put Away Detail
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead className="bg-orange-500 text-white">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} className="px-4 py-2 text-left">
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
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Put Away Details Form */}
      <div className="border rounded-lg p-4 shadow-md space-y-4">
        <h2 className="font-semibold text-lg">Put Away Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <select className="border p-2 rounded">
            <option>JT1 - A</option>
            <option>JT2 - A</option>
          </select>
          <select className="border p-2 rounded">
            <option>Device 1</option>
            <option>Device 2</option>
          </select>
          <input
            className="border p-2 rounded"
            placeholder="Forklift Driver Name"
          />
          <input
            className="border p-2 rounded"
            placeholder="Forklift Driver Phone"
          />
        </div>
        <Button variant="primary">Create Put Away</Button>
      </div>

      {/* Suggest Location + Warehouse List */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 shadow-md">
          <h2 className="font-semibold mb-2">Suggest Location</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between border p-2 rounded">
              <span>ZONE JT1 BIN A</span> <span>Remaining: 50</span>
            </li>
            <li className="flex justify-between border p-2 rounded">
              <span>ZONE JT2 BIN A</span> <span>Remaining: 70</span>
            </li>
            <li className="flex justify-between border p-2 rounded">
              <span>ZONE JT6 BIN A</span> <span>Remaining: 25</span>
            </li>
          </ul>
        </div>
        <div className="border rounded-lg p-4 shadow-md">
          <h2 className="font-semibold mb-2">
            List Location in Central Warehouse
          </h2>
          <input
            placeholder="Search bar"
            className="border p-2 rounded w-full mb-2"
          />
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between border p-2 rounded">
              <span>ZONE JT1 BIN A</span> <span>70</span>
            </li>
            <li className="flex justify-between border p-2 rounded">
              <span>ZONE JT2 BIN A</span> <span>10</span>
            </li>
            <li className="flex justify-between border p-2 rounded">
              <span>ZONE JT6 BIN A</span> <span>75</span>
            </li>
          </ul>
        </div>
      </div>

      {/* List SKU */}
      <div className="border rounded-lg shadow-sm overflow-x-auto">
        <h2 className="bg-orange-500 text-white p-2 font-semibold">List SKU</h2>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-orange-100">
              <th className="px-4 py-2 text-left">Delivery Order</th>
              <th className="px-4 py-2">Total SKU</th>
              <th className="px-4 py-2">Total Qty Plan</th>
              <th className="px-4 py-2">UoM</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-4 py-2">188258</td>
              <td className="px-4 py-2">1</td>
              <td className="px-4 py-2">138</td>
              <td className="px-4 py-2">DUS</td>
            </tr>
            <tr className="border-b">
              <td className="px-4 py-2">188260</td>
              <td className="px-4 py-2">3</td>
              <td className="px-4 py-2">700</td>
              <td className="px-4 py-2">DUS</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PutAwayDetail;
