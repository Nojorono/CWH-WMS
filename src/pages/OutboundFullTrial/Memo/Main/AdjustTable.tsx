import { useEffect, useMemo, useState, useRef } from "react";
import { FaEye, FaEdit, FaRegTimesCircle } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate, useSearchParams } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_MEMO } from "../../../../constants/statusMaps";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { ActionIcon } from "../Helper/ActionIcon ";
import { formatDateIndo } from "../../../../helper/FormatDate";
import { EndPoint } from "../../../../utils/EndPoint";
import { getCurrentRole } from "../../../../utils/rolePermissions";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import TableComponent from "../../../../components/tables/ActionTable/TableComponent";
import ActIndicator from "../../../../components/ui/activityIndicator";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";

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
  const roleName = getCurrentRole() || "";
  const { fetchUsingPagination, list, pagination, isLoading } = useStoreOutboundMemo();

  // 🔹 Sinkronisasi dengan URL Search Params
  const [searchParams, setSearchParams] = useSearchParams();

  // Ambil halaman dari URL (default: 1), dikurangi 1 untuk index table (0-based)
  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;

  // State untuk ukuran baris per halaman
  const [pageSize, setPageSize] = useState(10);

  // 🔹 REF LOGIC: Untuk mencegah reset ke halaman 1 saat 'Back'
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    globalFilter,
    filteredStatus,
    filteredTypeOutbound,
    filteredHasDO,
  });

  // 🔹 Fungsi untuk mengubah halaman (Update URL)
  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);

    if (newSize !== pageSize) {
      setPageSize(newSize);
    }
  };

  // 🔹 Reset ke halaman 1 HANYA jika filter benar-benar berubah secara manual
  useEffect(() => {
    // 1. Lewati eksekusi jika ini adalah render pertama (mencegah reset saat back)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 2. Cek apakah ada perubahan nilai filter yang sesungguhnya
    const hasFilterChanged =
      prevFiltersRef.current.globalFilter !== globalFilter ||
      prevFiltersRef.current.filteredStatus !== filteredStatus ||
      prevFiltersRef.current.filteredTypeOutbound !== filteredTypeOutbound ||
      prevFiltersRef.current.filteredHasDO !== filteredHasDO;

    if (hasFilterChanged) {
      // Update referensi filter lama dengan yang baru
      prevFiltersRef.current = {
        globalFilter,
        filteredStatus,
        filteredTypeOutbound,
        filteredHasDO,
      };

      // Hanya paksa ke halaman 1 jika filter berubah
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, filteredStatus, filteredTypeOutbound, filteredHasDO]);

  // 🔹 Fetch data setiap kali pagination atau filter berubah
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: currentPage,
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
      type: filteredTypeOutbound || "",
      has_do: filteredHasDO || "",
      sortOrder: "DESC",
    });
  }, [
    fetchUsingPagination,
    currentPage,
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

  const handleDelete = async (id: string) => {
  showConfirmDialog(
    async () => {
      try {
        await axiosInstance.post(`outbound-memo/${id}/cancelled`);
        showSuccessToast("Outbound memo berhasil dibatalkan");

        if (fetchUsingPagination) {
          fetchUsingPagination({
            page: currentPage,
            limit: pageSize,
            search: globalFilter || "",
            status: filteredStatus || "",
            sortOrder: "DESC",
          });
        }
      } catch (error: any) {
        console.error("Error cancelling memo via axiosInstance:", error);
        const errorMsg = error.response?.data?.message || "Gagal membatalkan outbound memo";
        showErrorToast(errorMsg);
      }
    },
    {
      title: "Cancel Memo",
      text: "Apakah Anda yakin ingin membatalkan memo ini?",
      icon: "warning",
      confirmButtonText: "Ya, Cancel Memo!",
      cancelButtonText: "Tidak, Batalkan",
    },
  );
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
      { accessorKey: "so_number", header: "SO No" },
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
          return numbers.length === 0 ? "-" : numbers.join(", ");
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

              {(roleName === "TRANSPORT_SUPERVISOR" ||
                roleName === "superadmin") && (
                <>
                  <ActionIcon
                    icon={FaEdit}
                    enabled={canEdit}
                    color="text-blue-600"
                    title={memo.has_do ? "Memo has DO" : "Edit"}
                    onClick={() => handleUpdate(memo.id)}
                  />

                  <ActionIcon
                    icon={FaRegTimesCircle}
                    enabled={canDelete}
                    color="text-red-600"
                    title="Cancel Memo"
                    onClick={() => handleDelete(memo.id)}
                  />
                </>
              )}
            </div>
          );
        },
      },
    ],
    [roleName, currentPage, pageSize],
  );

  const mappedList = useMemo(() => {
    return (list || []).map((item: any, index: number) => ({
      ...item,
      no: pageIndex * pageSize + (index + 1),
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
      has_do: item.has_do || false,
      outbound_do: item.outbound_do || {},
    }));
  }, [list, pageIndex, pageSize]);

  return (
    <div className="flex flex-col gap-4">

      {isLoading && <ActIndicator />}

      <TableComponent
        data={mappedList}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default AdjustTable;
