import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
} from "@tanstack/react-table";
import DataTable from "./TableTab";
import { EndPoint } from "../../../../utils/EndPoint";
import { formatDateIndo } from "../../../../helper/FormatDate";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";

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
    axiosInstance
      .get(`${EndPoint}master-pallet/by-code/${palletCode}/current`, {})
      .then((res) => {
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
      accessorKey: "item_name",
      header: "SKU Name",
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
      accessorKey: "status_inventory",
      header: "Status Inventory",
    },
    {
      accessorKey: "production_date",
      header: "Production Date",
      cell: (info) => formatDateIndo(info.getValue() as string) || "-",
    },
    {
      accessorKey: "week_number",
      header: "Week Number",
      cell: (info) => info.getValue(),
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
