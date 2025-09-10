import React, { useMemo, useState } from "react";
import { FaEye, FaCheck } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import Badge from "../../../../components/ui/badge/Badge";
import Button from "../../../../components/ui/button/Button";
import { InboundPlanning } from "../../../../DynamicAPI/types/InboundPlanningTypes";
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
            <Button
              variant="outline"
              size="xsm"
              onClick={() => handleModalTab(row.original)}
              startIcon={<FaEye className="size-5" />}
            >
              Detail
            </Button>
          );
        },
      },
    ],
    [onDetail]
  );

  // const [openMdlTab, setOpenMdlTab] = useState(false);

  const handleModalTab = (data: any) => {
    navigate("/inbound_planning/detail", { state: { data } });
  };

  // const onClose = () => {
  //   setOpenMdlTab(false);
  // };

  // const handleSubmit = (data: any) => {
  //   console.log("Submitted Data:", data);
  // };

  // const handleConfirmInbound = async (id: number) => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const response = await fetch(
  //       `http://10.0.29.47:9005/inbound-plan/status-in-progress/${id}`,
  //       {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );
  //     const result = await response.json();
  //     console.log("Confirm Inbound Result:", result);

  //     if (!response.ok || !result.success) {
  //       throw new Error(result.message || "Failed to update status");
  //     }
  //     if (onRefresh) {
  //       console.log("onRefresh called");
  //       onRefresh();
  //     }

  //     showSuccessToast("Inbound confirmed successfully!");
  //     // Optionally, show success message or refresh data here
  //   } catch (error: any) {
  //     // Handle error, e.g., show notification
  //     console.error("Error confirming inbound:", error.message || error);
  //     showErrorToast(
  //       error.message || "Failed to confirm inbound. Please try again."
  //     );
  //   }
  // };

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
