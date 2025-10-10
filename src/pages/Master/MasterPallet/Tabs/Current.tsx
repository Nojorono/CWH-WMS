import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import axios from "axios";
import DataTable from "./TableTab";
import { EndPoint } from "../../../../utils/EndPoint";

type ItemData = {
  item_id: string;
  current_quantity: number;
  uom: string;
  last_updated: string;
  production_date: string;
};

type HistoryProps = {
  palletCode?: string;
};

export default function CurrentQuantityTable({ palletCode }: HistoryProps) {
  const [data, setData] = useState<ItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!palletCode) return;

    setIsLoading(true);
    const token = localStorage.getItem("token");
    axios
      .get(`${EndPoint}master-pallet/by-code/${palletCode}/current`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        console.log("Fetched items:", res.data.data);

        setData(res.data.data);
      })
      .catch((err) => {
        console.error("Error fetching items:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [palletCode]);

  const columns: ColumnDef<ItemData>[] = [
    {
      accessorKey: "item_id",
      header: "SKU ID",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "current_quantity",
      header: "Current Quantity",
    },
    {
      accessorKey: "uom",
      header: "UOM",
    },
    {
      accessorKey: "production_date",
      header: "Batch Code",
      cell: (info) =>
        new Date(info.getValue() as string).toISOString().split("T")[0],
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-orange-600 font-medium">Loading...</span>
        </div>
      ) : (
        <DataTable data={data} columns={columns} pageSize={10} />
      )}
    </>
  );
}
