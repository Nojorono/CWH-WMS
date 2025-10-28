import { useMemo } from "react";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { InboundPlanning } from "../../../../DynamicAPI/types/InboundGoodStock";
import { useNavigate } from "react-router-dom";
import { formatDateIndo } from "../../../../helper/FormatDate";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_INBOUND } from "../../../../constants/statusMaps";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";

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
  const { deleteData } = useStoreInboundGoodStock();

  const columns: ColumnDef<InboundPlanning>[] = useMemo(
    () => [
      {
        accessorKey: "inbound_number",
        header: "Inbound No",
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: ({ row }) => formatDateIndo(row.original.createdAt),
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
        type: "number",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_INBOUND}
            variant="solid"
            size="sm"
          />
        ),
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
              {["CREATED", "WAITING FOR REVISION"].includes(
                row.original.status
              ) && (
                <>
                  <FaEdit
                    className="size-5 cursor-pointer"
                    style={{ color: "blue" }}
                    onClick={() => handleUpdate(row.original)}
                    title="Edit"
                  />

                  <FaTrash
                    className="size-5 cursor-pointer"
                    style={{ color: "red" }}
                    onClick={() => handleDelete(row.original.id)}
                    title="Delete"
                  />
                </>
              )}
            </div>
          );
        },
      },
    ],
    [onDetail]
  );

  const handleDetail = (data: any) => {
    console.log("passing for detail data", data);
    navigate("/inbound_planning/process", {
      state: { data, mode: "detail" },
    });
  };

  const handleUpdate = (data: any) => {
    console.log("passing for update data", data);
    navigate("/inbound_planning/process", {
      state: { data, mode: "edit", title: "Update Inbound Planning" },
    });
  };

  const handleDelete = (id: any) => {
    console.log("delete data with id", id);
    deleteData(id);
  };

  return (
    <>
      <TableComponent
        data={data}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={5}
      />
    </>
  );
};

export default AdjustTable;
