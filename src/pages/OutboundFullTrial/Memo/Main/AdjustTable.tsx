import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../TableAndForm/TableComponent";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_MEMO } from "../../../../constants/statusMaps";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { formatDate } from "../TableAndForm/MemoCreateProcess";

type MemoData = {
  no: number;
  id: string;
  outbound_memo_number: string;
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
  type?: string;
};

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
}: MenuTableProps) => {
  const navigate = useNavigate();
  const roleName = localStorage.getItem("role_name");
  const { fetchUsingPagination, list, pagination } = useStoreOutboundMemo();

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // 🔹 Fetch data setiap kali pagination / search berubah
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1, // jika backend 1-based
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus]);

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

  const columns: ColumnDef<MemoData>[] = useMemo(
    () => [
      { accessorKey: "no", header: "No" },
      { accessorKey: "outbound_memo_number", header: "Memo No" },
      { accessorKey: "deliveryDate", header: "Delivery Date" },
      { accessorKey: "origin", header: "Origin" },
      { accessorKey: "destination", header: "Destination" },
      { accessorKey: "shipTo", header: "Ship To" },
      { accessorKey: "requestor", header: "Requestor" },
      { accessorKey: "type", header: "Type Outbound" },
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

  // Mapping API data to table data
  const mappedList = (list || []).map((item: any, index: number) => ({
    no: index + 1,
    id: item.id,
    outbound_memo_number: item.outbound_memo_number || "-",
    type: item.type || "-",
    deliveryDate: formatDate(item.delivery_date),
    origin: item.origin || "-",
    destination: item.destination || "-",
    shipTo: item.ship_to || "-",
    requestor: item.requestor || "-",
    status: item.status || "PENDING",
    createdDate: formatDate(item.createdAt),
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
    deletedAt: item.deletedAt || null,
    inventory_tracking_id: item.inventory_tracking_id || "",
    outbound_memo_id: item.outbound_memo_id || "",
    outbound_memo_detail_id: item.outbound_memo_detail_id || "",
    product_id: item.product_id || "",
    product_name: item.product_name || "",
    qty: item.qty || 0,
    uom: item.uom || "",
    warehouse_id: item.warehouse_id || "",
  }));

  return (
    <div className="flex flex-col gap-4">
      <TableComponent
        data={mappedList}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={(page, size) => {
          setPageIndex(page);
          setPageSize(size);
        }}
      />
    </div>
  );
};

export default AdjustTable;
