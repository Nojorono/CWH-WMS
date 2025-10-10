import React, { useMemo } from "react";
import { FaEye, FaEdit, FaPlus } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { useNavigate } from "react-router-dom";
import Button from "../../../../components/ui/button/Button";

type MemoData = {
  no: number;
  id: string;
  memoId: string;
  deliveryDate: string;
  origin: string;
  destination: string;
  shipTo: string;
  requestor: string;
  status: string;
  createdDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  inventory_tracking_id: string;
  outbound_memo_id: string;
  outbound_memo_detail_id: string;
  product_id: string;
  product_name: string;
  qty: number;
  uom: string;
  warehouse_id: string;
};

type MenuTableProps = {
  data: MemoData[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
};

const AdjustTable = ({
  data,
  globalFilter,
  setGlobalFilter,
  onRefresh,
}: MenuTableProps) => {
  const navigate = useNavigate();


  console.log("Data in AdjustTable:", data);
  

  const handleDetail = (data: MemoData) => {
    navigate("/memo/process", {
      state: { data, mode: "detail", title: "Detail Memo" },
    });
  };

  const handleUpdate = (data: MemoData) => {
    navigate("/memo/process", {
      state: { data, mode: "edit", title: "Update Memo" },
    });
  };

  const columns: ColumnDef<MemoData>[] = useMemo(
    () => [
      { accessorKey: "no", header: "No" },
      { accessorKey: "memoId", header: "Memo ID" },
      { accessorKey: "deliveryDate", header: "Delivery Date" },
      { accessorKey: "origin", header: "Origin" },
      { accessorKey: "destination", header: "Destination" },
      { accessorKey: "shipTo", header: "Ship To" },
      { accessorKey: "requestor", header: "Requestor" },
      { accessorKey: "status", header: "Status" },
      { accessorKey: "createdDate", header: "Created Date" },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-3">
            <FaEye
              className="size-5 cursor-pointer text-green-600 hover:scale-110 transition"
              onClick={() => handleDetail(row.original)}
              title="Detail"
            />
            <FaEdit
              className="size-5 cursor-pointer text-blue-600 hover:scale-110 transition"
              onClick={() => handleUpdate(row.original)}
              title="Edit"
            />
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-4">
      <TableComponent
        data={data}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={5}
      />
    </div>
  );
};

export default AdjustTable;
