import React, { useMemo, useState } from "react";
import { FaEye, FaCheck, FaEdit } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { useNavigate } from "react-router-dom";
// import Button from "../../../../components/ui/button/Button";
// import Badge from "../../../../components/ui/badge/Badge";
import { Memo } from "../../../../DynamicAPI/types/MemoTypes";
// import { toLocalISOString } from "../../../../helper/FormatDate";

type Memo = {
  id?: string;
  delivery_date: string;
  origin: string;
  destination: number;
  ship_to: number;
  requestor: string;
  status: string;
  createdAt: string;
};

type MenuTableProps = {
  data: Memo[];
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

  const columns: ColumnDef<Memo>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Memo ID",
      },
      {
        accessorKey: "delivery_date",
        header: "Delivery Date",
      },
      {
        accessorKey: "origin",
        header: "Origin",
      },
      {
        accessorKey: "destination",
        header: "Destination",
      },
      {
        accessorKey: "ship_to",
        header: "Ship To",
      },
      {
        accessorKey: "requestor",
        header: "Requestor",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "createdAt",
        header: "Created Date",
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <FaEye
              className="size-5 cursor-pointer"
              style={{ color: "green" }}
              onClick={() => handleDetail(row.original)}
              title="Detail"
            />
          </div>
        ),
      },
    ],
    []
  );

  const handleDetail = (data: any) => {
    navigate("/memo/create_memo", {
      state: { data, mode: "detail" },
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
