import { useMemo } from "react";
import { FaEye, FaEdit } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../../../../components/tables/MasterDataTable/TableComponent";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_MEMO } from "../../../../constants/statusMaps";

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

  const handleDetail = (id: string) => {
    navigate("/memo/process", {
      state: { data: id, mode: "detail", title: "Detail Memo" },
    });
  };

  const handleUpdate = (id: string) => {
    navigate("/memo/process", {
      state: { data: id, mode: "edit", title: "Update Memo" },
    });
  };

  const roleName = localStorage.getItem("role_name");

  const columns: ColumnDef<MemoData>[] = useMemo(
    () => [
      { accessorKey: "no", header: "No" },
      { accessorKey: "memoId", header: "Memo ID" },
      { accessorKey: "deliveryDate", header: "Delivery Date" },
      { accessorKey: "origin", header: "Origin" },
      { accessorKey: "destination", header: "Destination" },
      { accessorKey: "shipTo", header: "Ship To" },
      { accessorKey: "requestor", header: "Requestor" },
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
      { accessorKey: "createdDate", header: "Created Date" },
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
