"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import DataTable from "./TableTab";
import { ColumnDef } from "@tanstack/react-table";
import { EndPoint } from "../../../../utils/EndPoint";
import { formatDateIndo } from "../../../../helper/FormatDate";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

type QuantityHistory = {
  id: string;
  pallet_id: string;
  item_id: string;
  item_name: string;
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
  status_inventory: string;
  
};

type HistoryProps = {
  palletCode?: string;
};

export default function QuantityHistoryTable({ palletCode }: HistoryProps) {
  const [data, setData] = useState<QuantityHistory[]>([]);

  useEffect(() => {
    if (!palletCode) return;

    const token = localStorage.getItem("token");
    axiosInstance
      .get(`${EndPoint}master-pallet/by-code/${palletCode}/quantity-history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setData(res.data.data))
      .catch((err) => console.error("Error fetching quantity history:", err));
  }, [palletCode]);

  const columns: ColumnDef<QuantityHistory>[] = [
    {
      accessorKey: "createdAt",
      header: "Date/Time",
      cell: (info) =>
        new Date(info.getValue() as string).toLocaleString("id-ID"),
    },
    {
      accessorKey: "operation_type",
      header: "Operation Type",
      cell: (info) => {
        const value = info.getValue() as string;
        if (value === "ADD")
          return <span className="text-green-600">ADD</span>;
        if (value === "REMOVE")
          return <span className="text-red-600">REMOVE</span>;
        if (value === "MOVE")
          return <span className="text-blue-600">MOVE</span>;
        return value;
      },
    },
    { accessorKey: "item_name", header: "SKU Name" },
    { accessorKey: "new_quantity", header: "Quantity" },
    {
      accessorKey: "production_date",
      header: "Production Date",
      cell: (info) => formatDateIndo(info.getValue() as string),
    },
    { accessorKey: "week_number", header: "Week Number" },
    { accessorKey: "notes", header: "Notes" },
    { accessorKey: "reference_type", header: "Reference Type" },
    { accessorKey: "status_inventory", header: "Status Inventory" },
  ];

  return (
    <>
      <DataTable data={data} columns={columns} pageSize={10} />
    </>
  );
}
