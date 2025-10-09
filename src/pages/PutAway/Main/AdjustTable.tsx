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
  inventoryTracking: {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    pallet_id: string;
    warehouse_id: string;
    warehouse_sub_id: string;
    warehouse_bin_id: string | null;
    inventory_date: string;
    inventory_status: string;
    inventory_note: string;
  };
  destination_bin_id: string;
  destinationBin: {
    id: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    organization_id: number;
    warehouse_sub_id: string;
    name: string;
    code: string;
    description: string;
    capacity_pallet: number;
    barcode_image_url: string;
    current_pallet: string | null;
  };
  forklift_driver_id: string;
  driver_name: string;
  driver_phone: string;
  status: string;
  notes: string;
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

  const columns: ColumnDef<AdjustData>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Put Away ID",
      },
      {
        accessorKey: "inventoryTracking.pallet_id",
        header: "Pallet ID",
        cell: ({ row }) => row.original.inventoryTracking?.pallet_id ?? "-",
      },
      {
        accessorKey: "inventory_tracking_id",
        header: "Inventory Tracking ID",
      },
      {
        accessorKey: "destinationBin.code",
        header: "Bin Code",
        cell: ({ row }) => row.original.destinationBin?.code ?? "-",
      },
      {
        accessorKey: "destinationBin.name",
        header: "Bin Name",
        cell: ({ row }) => row.original.destinationBin?.name ?? "-",
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
      // {
      //   accessorKey: "notes",
      //   header: "Notes",
      // },
      // {
      //   id: "actions",
      //   header: "Action",
      //   cell: ({ row }) => (
      //     <div style={{ display: "flex", gap: "8px" }}>
      //       <FaEye
      //         className="size-5 cursor-pointer"
      //         style={{ color: "green" }}
      //         onClick={() => handleDetail(row.original)}
      //         title="Detail"
      //       />
      //       <FaEdit
      //         className="size-5 cursor-pointer"
      //         style={{ color: "blue" }}
      //         onClick={() => handleUpdate(row.original)}
      //         title="Edit"
      //       />
      //     </div>
      //   ),
      // },
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
      pageSize={5}
    />
  );
};

export default AdjustTable;
