import React, { useMemo } from "react";
import { FaEye, FaEdit } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../components/tables/MasterDataTable/TableComponent";
import { useNavigate } from "react-router-dom";

type AdjustData = {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  inventory_tracking_id: string;
  destination_bin_id: string;
  forklift_driver_id: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  notes: string;
  palletCode: string;
  warehouseSubName: string;
  suggestZone: string;
  suggestBin: string;
  totalSku: number;
  totalQty: number;
  palletItemUom: string;
};

type MenuTableProps = {
  data: AdjustData[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
};

const AdjustTable = ({
  data,
  globalFilter,
  setGlobalFilter,
  onDetail,
  onRefresh,
}: MenuTableProps) => {
  const navigate = useNavigate();

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "palletCode",
        header: "Pallet Code",
      },
      {
        accessorKey: "suggestZone",
        header: "Suggest Zone",
      },
      {
        accessorKey: "suggestBin",
        header: "Suggest Bin",
      },
      {
        accessorKey: "totalSku",
        header: "Total SKU",
      },
      {
        accessorKey: "totalQty",
        header: "Total Qty",
      },
      {
        accessorKey: "driver_name",
        header: "Forklift Driver",
      },
      {
        accessorKey: "driver_phone",
        header: "Driver Phone",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div style={{ display: "flex", gap: "8px" }}>
            <FaEye
              className="size-5 cursor-pointer"
              style={{ color: "green" }}
              onClick={() => handleDetail(row.original)}
              title="Detail"
            />
            {row.original.status !== "COMPLETED" && (
              <FaEdit
                className="size-5 cursor-pointer"
                style={{ color: "blue" }}
                onClick={() => handleUpdate(row.original)}
                title="Edit"
              />
            )}
          </div>
        ),
      },
    ],
    []
  );

  const handleDetail = (data: AdjustData) => {
    navigate("/putaway/process", {
      state: { data, mode: "detail" },
    });
  };

  const handleUpdate = (data: AdjustData) => {
    navigate("/putaway/process", {
      state: { data, mode: "edit", title: "Update PutAway" },
    });
  };

  return (
    <TableComponent
      data={data}
      columns={columns}
      globalFilter={globalFilter}
      setGlobalFilter={setGlobalFilter}
      pageSize={10}
    />
  );
};

export default AdjustTable;
