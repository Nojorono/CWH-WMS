"use client";

import React, { useEffect, useState } from "react";
import DataTable from "./TableTab";
import { ColumnDef } from "@tanstack/react-table";
import { EndPoint } from "../../../../utils/EndPoint";
import { formatDateIndo } from "../../../../helper/FormatDate";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { formatDateTimeIndo } from "../../../../helper/FormatDateTime";
import Button from "../../../../components/ui/button/Button";

type QuantityHistory = {  id: string;
  pallet_id: string;
  item_id: string;
  item_name: string;
  previous_quantity: number;
  quantity_change: number;
  new_quantity: number;
  operation_type: "ADD" | "REMOVE" | "MOVE" | string;
  reference_id: string;
  reference_type: string;
  notes: string;
  user_id: string;
  uom: string;
  createdAt: string;
  last_updated?: string | null;
  production_date: string;
  week_number: number;
  status_inventory?: string;
};

type HistoryProps = {
  palletCode?: string;
};

export default function QuantityHistoryTable({ palletCode }: HistoryProps) {
  const [data, setData] = useState<QuantityHistory[]>([]);
  const [notesDetail, setNotesDetail] = useState<string | null>(null);

  useEffect(() => {    if (!palletCode) return;

    axiosInstance
      .get(
        `${EndPoint}master-pallet/by-code/${palletCode}/quantity-history`,
        {},
      )
      .then((res) => setData(res.data.data || []))
      .catch((err) => console.error("Error fetching quantity history:", err));
  }, [palletCode]);

  const columns: ColumnDef<QuantityHistory>[] = [
    {
      accessorKey: "operation_type",
      header: "Operation Type",
      cell: (info) => {
        const value = info.getValue() as string;
        if (value === "ADD") return <span className="text-green-600">ADD</span>;
        if (value === "REMOVE")
          return <span className="text-red-600">REMOVE</span>;
        if (value === "MOVE")
          return <span className="text-blue-600">MOVE</span>;
        return value;
      },
    },
    { accessorKey: "item_name", header: "SKU Name" },
    { accessorKey: "uom", header: "UOM" },
    { accessorKey: "previous_quantity", header: "Previous Qty" },
    { accessorKey: "quantity_change", header: "Qty Change" },
    { accessorKey: "new_quantity", header: "New Quantity" },
    {
      accessorKey: "production_date",
      header: "Production Date",
      cell: (info) => formatDateIndo(info.getValue() as string) || "-",
    },
    { accessorKey: "week_number", header: "Week Number" },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: (info) => {
        const notes = String(info.getValue() ?? "").trim();
        if (!notes) return <span className="text-slate-400">-</span>;

        return (
          <div className="flex items-center gap-2 max-w-[200px]">
            <span className="truncate text-sm flex-1 min-w-0" title={notes}>
              {notes}
            </span>
            <button
              type="button"
              onClick={() => setNotesDetail(notes)}
              className="shrink-0 text-xs font-semibold text-orange-600 hover:text-orange-700 underline"
            >
              View
            </button>
          </div>
        );
      },
    },    { accessorKey: "reference_type", header: "Reference Type" },
    {
      id: "last_updated",
      header: "Last Updated",
      cell: ({ row }) => {
        const trackingDate =
          row.original.last_updated || row.original.createdAt;
        return formatDateTimeIndo(trackingDate) || "-";
      },
    },
  ];

  return (
    <>
      <DataTable data={data} columns={columns} pageSize={10} />

      {notesDetail && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-3">Notes Detail</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words max-h-[50vh] overflow-y-auto">
              {notesDetail}
            </p>
            <div className="flex justify-end mt-4">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setNotesDetail(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}