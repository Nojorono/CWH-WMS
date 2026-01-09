import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaRegTimesCircle } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../TableAndForm/TableComponent";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_MEMO } from "../../../../constants/statusMaps";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
// import { formatDate } from "../TableAndForm/MemoCreateProcess";
import { ActionIcon } from "../Helper/ActionIcon ";
import { formatDateIndo } from "../../../../helper/FormatDate";
import { EndPoint } from "../../../../utils/EndPoint";

type MemoData = {
  outbound_do: any;
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
  has_do?: boolean;
};

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
  filteredTypeOutbound?: any;
  filteredHasDO?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
  filteredTypeOutbound,
  filteredHasDO,
}: MenuTableProps) => {
  const navigate = useNavigate();
  const roleName = localStorage.getItem("role_name") || "";
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
      type: filteredTypeOutbound || "",
      has_do: filteredHasDO || "",
      sortOrder: "DESC",
    });
  }, [
    fetchUsingPagination,
    pageIndex,
    pageSize,
    globalFilter,
    filteredStatus,
    filteredTypeOutbound,
    filteredHasDO,
  ]);

  const handleDetail = (id: string) => {
    navigate("/memo/process", {
      state: { data: id, mode: "detail", title: "Detail Memo Created" },
    });
  };

  const handleUpdate = (id: string) => {
    navigate("/memo/process", {
      state: { data: id, mode: "edit", title: "Update Memo" },
    });
  };

  const canEditMemo = (memo: MemoData, roleName: string) => {
    if (roleName === "SUPERVISOR") return false;
    return memo.status === "PENDING" && !memo.has_do;
  };

  const canDeleteMemo = (memo: MemoData) => {
    if (memo.status === "CANCELLED") return false;
    return !memo.has_do;
  };

  const columns: ColumnDef<MemoData>[] = useMemo(
    () => [
      { accessorKey: "outbound_memo_number", header: "Memo No" },
      {
        accessorKey: "has_do",
        header: "Has DO",
        cell: ({ row }) => (row.original.has_do ? "Yes" : "No"),
      },
      {
        accessorKey: "outbound_do_number",
        header: "DO Number",
        cell: ({ row }) => {
          const raw = row.original.outbound_do;
          const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
          const numbers = arr
            .map((d: any) => d?.outbound_do_number)
            .filter(Boolean);
          if (numbers.length === 0) return "-";
          // if multiple, show comma-separated list (or you can change to show first + count)
          return numbers.join(", ");
        },
      },

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
        cell: ({ row }) => {
          const memo = row.original;

          const canEdit = canEditMemo(memo, roleName);
          const canDelete = canDeleteMemo(memo);

          return (
            <div className="flex gap-3">
              <ActionIcon
                icon={FaEye}
                enabled
                color="text-green-600"
                title="Detail"
                onClick={() => handleDetail(memo.id)}
              />

              {roleName !== "SUPERVISOR" && (
                <ActionIcon
                  icon={FaEdit}
                  enabled={canEdit}
                  color="text-blue-600"
                  title={
                    memo.has_do
                      ? "Edit tidak tersedia karena sudah punya DO"
                      : memo.status !== "PENDING"
                      ? "Edit hanya bisa jika status PENDING"
                      : "Edit"
                  }
                  onClick={() => handleUpdate(memo.id)}
                />
              )}

              <ActionIcon
                icon={FaRegTimesCircle}
                enabled={canDelete}
                color="text-red-600"
                title={
                  memo.status === "CANCELLED"
                    ? "Tidak bisa delete memo CANCELLED"
                    : memo.has_do
                    ? "Tidak bisa delete karena sudah punya DO"
                    : "Cancel Memo"
                }
                onClick={() => handleDelete(memo.id)}
              />
            </div>
          );
        },
      },
    ],
    [roleName]
  );

  const handleDelete = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found in localStorage");
        return;
      }

      const url = `${EndPoint}outbound-memo/${id}/cancelled`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to cancel memo:", res.status, text);
        return;
      }

      // refresh list after successful cancel
      if (fetchUsingPagination) {
        fetchUsingPagination({
          page: pageIndex + 1,
          limit: pageSize,
          search: globalFilter || "",
          status: filteredStatus || "",
          sortOrder: "DESC",
        });
      }
    } catch (error) {
      console.error("Error cancelling memo:", error);
    }
  };

  // Mapping API data to table data
  const mappedList = (list || []).map((item: any, index: number) => ({
    no: index + 1,
    id: item.id,
    outbound_memo_number: item.outbound_memo_number || "-",
    type: item.type || "-",
    deliveryDate: formatDateIndo(item.delivery_date),
    origin: item.origin || "-",
    destination: item.destination || "-",
    shipTo: item.ship_to || "-",
    requestor: item.requestor || "-",
    status: item.status || "PENDING",
    createdDate: formatDateIndo(item.createdAt),
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
    has_do: item.has_do || false,
    outbound_do: item.outbound_do || {},
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
