import React, { useMemo, useState } from "react";
import { FaEye, FaCheck, FaEdit } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { useNavigate } from "react-router-dom";
import Button from "../../../../components/ui/button/Button";
import Badge from "../../../../components/ui/badge/Badge";
import { InboundPlanning } from "../../../../DynamicAPI/types/InboundGoodStock";
import { toLocalISOString } from "../../../../helper/FormatDate";

type PutAway = {
  id?: string;
  palletId: string;
  inboundId: string;
  totalSku: number;
  totalQty: number;
  suggestZone: string;
  suggestBin: string;
  forkliftDriver: string;
};

type MenuTableProps = {
  data: PutAway[];
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: number) => void;
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

  const columns: ColumnDef<PutAway>[] = useMemo(
    () => [
      {
        accessorKey: "palletId",
        header: "Pallet ID",
      },
      {
        accessorKey: "inboundId",
        header: "Inbound ID",
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
        accessorKey: "suggestZone",
        header: "Suggest Zone",
      },
      {
        accessorKey: "suggestBin",
        header: "Suggest Bin",
      },
      {
        accessorKey: "forkliftDriver",
        header: "Forklift Driver",
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
            <FaEdit
              className="size-5 cursor-pointer"
              style={{ color: "blue" }}
              onClick={() => handleUpdate(row.original)}
              title="Edit"
            />
          </div>
        ),
      },
    ],
    []
  );

  const handleDetail = (data: any) => {
    console.log("data", data);
    navigate("/putaway/process", {
      state: { data, mode: "detail" },
    });
  };

  const handleUpdate = (data: any) => {
    console.log("data", data);
    navigate("/putaway/process", {
      state: { data, mode: "edit", title: "Update Inbound Planning" },
    });
  };

  return (
    <>
      <TableComponent
        data={data}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        onDetail={onDetail}
        pageSize={5}
      />
    </>
  );
};

export default AdjustTable;
