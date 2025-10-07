"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { FaEdit } from "react-icons/fa";
import Button from "../../../../components/ui/button/Button";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import { useStorePutAwaySuggestion } from "../../../../DynamicAPI/stores/Store/MasterStore";
import {
  PutAwaySuggestionResponse,
  PutAwaySuggestion,
} from "../../../../DynamicAPI/types/PutawaySuggestionTypes";

// ==========================
// 🧩 Type Definitions
// ==========================
type PutAwayRow = {
  palletId: string;
  palletCode: string;
  totalQty: number;
  warehouseName: string;
  stagingArea: string;
  suggestZone: string;
  suggestBin: string;
  driver: string;
};

// ==========================
// 🧱 Component
// ==========================
const PutAwayDetail: React.FC = () => {
  const { list: putAwaySuggestions, fetchAll: fetchPutAwaySuggestions } =
    useStorePutAwaySuggestion();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ==========================
  // 🔁 Fetch Data on Mount
  // ==========================
  useEffect(() => {
    fetchPutAwaySuggestions();
  }, [fetchPutAwaySuggestions]);

  // ==========================
  // 🔍 Data Mapping (Response → Table)
  // ==========================
  const mappedData: PutAwayRow[] = useMemo(() => {
    console.log("Mapping Put Away Suggestions:", putAwaySuggestions);

    if (!putAwaySuggestions) return [];

    // ✅ Jika API kamu langsung mengembalikan object { palletSuggestions: [...] }
    //    maka cukup ambil langsung dari situ
    const suggestions =
      (putAwaySuggestions as any).palletSuggestions ||
      // fallback kalau nanti bentuknya jadi array
      (Array.isArray(putAwaySuggestions)
        ? putAwaySuggestions.flatMap(
            (res: any) =>
              res.data?.palletSuggestions || res.palletSuggestions || []
          )
        : []);

    console.log("Extracted Suggestions:", suggestions);

    // Mapping ke bentuk tabel
    return suggestions.map((suggestion: PutAwaySuggestion) => {
      const staging = suggestion.stagingPallet;
      const pallet = staging?.pallet;
      const warehouse = staging?.warehouse;
      const stagingArea = staging?.warehouseSub;
      const zone = suggestion.suggestedZone;
      const bin = suggestion.suggestedBin;

      return {
        palletId: pallet?.id || "-",
        palletCode: pallet?.pallet_code || "-",
        totalQty: pallet?.currentQuantity || 0,
        warehouseName: warehouse?.name || "-",
        stagingArea: stagingArea?.name || "-",
        suggestZone: zone?.name || "-",
        suggestBin: bin?.name || "-",
        driver: "Forklift Driver 1",
      };
    });
  }, [putAwaySuggestions]);

  console.log("Mapped Put Away Rows:", mappedData);

  // ==========================
  // 🧾 Table Columns
  // ==========================
  const columns = useMemo<ColumnDef<PutAwayRow>[]>(
    () => [
      { accessorKey: "palletCode", header: "Pallet Code" },
      { accessorKey: "totalQty", header: "Total Qty" },
      { accessorKey: "warehouseName", header: "Warehouse" },
      { accessorKey: "stagingArea", header: "Staging Area" },
      { accessorKey: "suggestZone", header: "Suggest Zone" },
      { accessorKey: "suggestBin", header: "Suggest Bin" },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              className="text-green-600"
              onClick={() =>
                console.log("Selected Pallet ID:", row.original.palletId)
              }
            >
              <FaEdit />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  // ==========================
  // 📦 Selection Handler
  // ==========================
  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  // ==========================
  // 🚀 Create Put Away
  // ==========================
  const createPutAway = () => {
    console.log("Selected Pallet IDs:", selectedIds);
    // TODO: POST ke endpoint /putaway/process
  };

  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb
        breadcrumbs={[
          { title: "Put Away List", path: "/putaway" },
          { title: "Put Away Process", path: "/putaway/process" },
        ]}
      />

      {/* ==========================
          📊 Table Section
      =========================== */}
      <TableComponent
        data={mappedData}
        columns={columns}
        onSelectionChange={handleSelectionChange}
      />

      {/* ==========================
          🧠 Put Away Details Section
      =========================== */}
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
