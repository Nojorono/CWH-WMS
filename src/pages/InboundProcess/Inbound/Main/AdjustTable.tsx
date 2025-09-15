import React, { useMemo, useState } from "react";
import { FaEye, FaCheck, FaEdit } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import Badge from "../../../../components/ui/badge/Badge";
import Button from "../../../../components/ui/button/Button";
import { InboundPlanning } from "../../../../DynamicAPI/types/InboundGoodStock";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { toLocalISOString } from "../../../../helper/FormatDate";

type MenuTableProps = {
  data: InboundPlanning[];
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

  const columns: ColumnDef<InboundPlanning>[] = useMemo(
    () => [
      {
        accessorKey: "inbound_number",
        header: "Inbound No",
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => toLocalISOString(row.original.createdAt),
      },

      {
        accessorKey: "license_plate",
        header: "Plat No",
      },
      {
        accessorKey: "driver_name",
        header: "Driver Name",
      },

      {
        accessorKey: "driver_phone",
        header: "Driver Phone",
      },
      {
        accessorKey: "status",
        header: "Status",
        // cell: ({ row }) => {
        //   const status = row.original.plan_status;
        //   let color: "error" | "info" | undefined;
        //   if (status === "DRAFT") color = "error";
        //   else if (status === "IN_PROGRESS") color = "info";
        //   return (
        //     <Badge variant="light" color={color}>
        //       {status}
        //     </Badge>
        //   );
        // },
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          return (
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
          );
        },
      },
    ],
    [onDetail]
  );

  const handleDetail = (data: any) => {
    console.log("data", data);
    navigate("/inbound_planning/update", {
      state: { data, mode: "detail" },
    });
  };

  const handleUpdate = (data: any) => {
    console.log("data", data);
    navigate("/inbound_planning/update", {
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
