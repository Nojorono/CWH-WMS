"use client";

import React, { useEffect, useState } from "react";
import DataTable from "./TableTab";
import { ColumnDef } from "@tanstack/react-table";
import { EndPoint } from "../../../../utils/EndPoint";
import { formatDateIndo } from "../../../../helper/FormatDate";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { formatDateTimeIndo } from "../../../../helper/FormatDateTime";

type QuantityHistory = {
  id: string;
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

  useEffect(() => {
    if (!palletCode) return;

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
    { accessorKey: "notes", header: "Notes" },
    { accessorKey: "reference_type", header: "Reference Type" },
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
    </>
  );
}
