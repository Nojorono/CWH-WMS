// src/pages/inbound/PutAwayDetail.tsx
import React, { useCallback, useState } from "react";
import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import { FaEye, FaCheck, FaEdit } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";

type Pallet = {
  palletId: string;
  totalSku: number;
  totalQty: number;
  staging: string;
  suggestZone: string;
  suggestBin: string;
  driver: string;
};

interface Props {
  globalFilter?: string;
  onSelectedChange?: (ids: any[]) => void; // ✅ callback ke parent
}

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

const PutAwayDetail: React.FC<Props> = ({ onSelectedChange, globalFilter }) => {

  
  const columns = useMemo<ColumnDef<Pallet>[]>(
    () => [
      { accessorKey: "palletId", header: "Pallet ID", selectedRow: true },
      { accessorKey: "totalSku", header: "Total SKU" },
      { accessorKey: "totalQty", header: "Total Qty" },
      { accessorKey: "staging", header: "Staging Area" },
      { accessorKey: "suggestZone", header: "Suggest Zone" },
      { accessorKey: "suggestBin", header: "Suggest Bin" },
      { accessorKey: "driver", header: "Forklift Driver" },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              className="text-green-600"
              onClick={() => console.log(row.original)}
            >
              <FaEdit />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const [selectedIds, setSelectedIds] = useState<any[]>([]);

  const handleSelectionChange = useCallback(
    (ids: any[]) => {
      setSelectedIds(ids);
      if (onSelectedChange) {
        onSelectedChange(ids);
      }
    },
    [onSelectedChange]
  );

  const createPutAway = () => {
    console.log("Selected IDs:", selectedIds);

  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div>
        <h1 className="text-xl font-bold text-indigo-800">Put Away</h1>
        <p className="text-sm text-orange-500">
          Put Away &gt; Put Away List &gt; Put Away Detail
        </p>
      </div>

      <TableComponent
        data={palletData}
        columns={columns}
        globalFilter={globalFilter}
        onSelectionChange={handleSelectionChange}
      />

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
      </div>
      <div className="flex justify-end space-x-4">
        <Button variant="primary" onClick={createPutAway}>
          Create Put Away
        </Button>
      </div>
    </div>
  );
};

export default PutAwayDetail;
