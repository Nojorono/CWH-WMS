"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "./TableTab";
import { ColumnDef } from "@tanstack/react-table";

type QuantityHistory = {
  id: string;
  pallet_id: string;
  item_id: string;
  previous_quantity: number;
  quantity_change: number;
  new_quantity: number;
  operation_type: "ADD" | "REMOVE" | "MOVE";
  reference_id: string;
  reference_type: string;
  notes: string;
  user_id: string;
  uom: string;
  createdAt: string;
  production_date: string;
  week_number: number;
};

type HistoryProps = {
  palletCode?: string;
};

export default function QuantityHistoryTable({ palletCode }: HistoryProps) {
  const [data, setData] = useState<QuantityHistory[]>([]);

  useEffect(() => {
    if (!palletCode) return;

    const token = localStorage.getItem("token");
    axios
      .get(
        `http://10.0.29.47:9005/master-pallet/by-code/${palletCode}/quantity-history`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => setData(res.data.data))
      .catch((err) => console.error("Error fetching quantity history:", err));
  }, []);

  const columns: ColumnDef<QuantityHistory>[] = [
    {
      accessorKey: "createdAt",
      header: "Date/Time",
      cell: (info) =>
        new Date(info.getValue() as string).toLocaleString("id-ID"),
    },
    {
      accessorKey: "operation_type",
      header: "Action",
      cell: (info) => {
        const value = info.getValue() as string;
        if (value === "ADD")
          return <span className="text-green-600">Added</span>;
        if (value === "REMOVE")
          return <span className="text-red-600">Removed</span>;
        if (value === "MOVE")
          return <span className="text-blue-600">Relocated</span>;
        return value;
      },
    },
    { accessorKey: "item_id", header: "SKU Name" },
    { accessorKey: "new_quantity", header: "Qty" },
    {
      accessorKey: "production_date",
      header: "Batch Code",
      cell: (info) =>
        new Date(info.getValue() as string).toISOString().split("T")[0],
    },
    { accessorKey: "week_number", header: "Week Number" },
    { accessorKey: "user_id", header: "Staff" },
    { accessorKey: "notes", header: "Reason" },
  ];

  return (
    <>
      <DataTable data={data} columns={columns} pageSize={10} />
    </>
  );
}
