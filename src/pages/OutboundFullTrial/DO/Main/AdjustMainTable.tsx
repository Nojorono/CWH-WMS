import { useMemo } from "react";
import { FaEye, FaEdit, FaAdjust, FaTasks } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_MEMO } from "../../../../constants/statusMaps";

type OutboundMemo = {
  id: string;
  requestor: string;
  origin: string;
  shipTo: string;
  destination: string;
  deliveryDate: string;
  status: string;
  notes: string;
};

type MemoData = {
  no: number;
  id: string;
  outboundDoNumber: string;
  expedition: string;
  origin: string;
  licensePlate: string;
  driverName: string;
  driverPhone: string;
  status: string;
  outboundType: string;
  deliveryDate: string;
  memoId: string[];
  outboundMemos: OutboundMemo[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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

  const handleDetail = (id: string) => {
    // navigate("/memo/process", {
    //   state: { data: id, mode: "detail", title: "Detail Memo" },
    // });
  };

  const handleUpdate = (id: string) => {
    // navigate("/memo/process", {
    //   state: { data: id, mode: "edit", title: "Update Memo" },
    // });
  };

  const handleAdjust = (data: MemoData) => {

    console.log("Adjust Memo Data:", data);
    
    // navigate("/outbound_do/adjust_memo", {
    //   state: { data: id, mode: "adjust", title: "Adjust Memo" },
    // });
  };

  const roleName = localStorage.getItem("role_name");

  const columns: ColumnDef<MemoData>[] = useMemo(
    () => [
      // { accessorKey: "no", header: "No" },
      { accessorKey: "outbound_do_number", header: "DO Number" },
      { accessorKey: "expedition", header: "Expedition" },
      { accessorKey: "origin", header: "Origin" },
      { accessorKey: "licensePlate", header: "License Plate" },
      { accessorKey: "driverName", header: "Driver Name" },
      { accessorKey: "driverPhone", header: "Driver Phone" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_MEMO}
            variant="solid"
            size="sm"
          />
        ),
      },
      { accessorKey: "deliveryDate", header: "Delivery Date" },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => (
          <div className="flex gap-3">
            <FaEye
              className="size-5 cursor-pointer text-green-600 hover:scale-110 transition"
              onClick={() => handleDetail(row.original.id)}
              title="Detail"
            />

            {roleName !== "SUPERVISOR" && (
              <FaEdit
                className={`size-5 cursor-pointer ${
                  row.original.status === "PENDING"
                    ? "text-blue-600 hover:scale-110"
                    : "text-gray-400 cursor-not-allowed"
                } transition`}
                onClick={() => {
                  if (row.original.status === "PENDING") {
                    handleUpdate(row.original.id);
                  }
                }}
                title={
                  row.original.status === "PENDING"
                    ? "Edit"
                    : "Edit hanya bisa jika status PENDING"
                }
                style={{
                  pointerEvents:
                    row.original.status === "PENDING" ? "auto" : "none",
                }}
              />
            )}

            <FaTasks
              className="size-5 cursor-pointer text-yellow-600 hover:scale-110 transition"
              onClick={() => handleAdjust(row.original)}
              title="Adjust Memo"
            />
          </div>
        ),
      },
    ],
    [roleName]
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
