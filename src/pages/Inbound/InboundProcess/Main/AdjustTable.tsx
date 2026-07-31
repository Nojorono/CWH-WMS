import { useEffect, useMemo, useState } from "react";
import { FaEye, FaEdit, FaTrash, FaBan } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { formatDateIndo } from "../../../../helper/FormatDate";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_INBOUND } from "../../../../constants/statusMaps";
import { useStoreInboundGoodStock } from "../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../components/ui/activityIndicator";
import TableComponent from "../../../../components/tables/ActionTable/TableComponent";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { ActionMenu } from "../../../OutboundFullTrial/PickingTransaction/components/actionMenu";
import {
  cancelInboundPlanService,
  deleteInboundPlanService,
} from "../services";

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: number) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
};

const AdjustTable = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
}: MenuTableProps) => {
  const navigate = useNavigate();

  const { fetchUsingPagination, list, pagination, isLoading } =
    useStoreInboundGoodStock();

  // 🔹 local state pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  const refreshList = () => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1,
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  };

  // 🔹 Fetch data setiap kali pagination / search berubah
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: pageIndex + 1,
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  }, [fetchUsingPagination, pageIndex, pageSize, globalFilter, filteredStatus]);

  // 🔹 Kolom Table
  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "inbound_number",
        header: "Inbound No",
      },
      {
        accessorKey: "origin",
        header: "Origin",
      },
      {
        accessorKey: "inbound_reference_number",
        header: "Inbound Reference No",
      },
      {
        id: "add_to_receipt_number",
        header: "Receipt No",
        // Karena data berada di dalam inbound_dos, kita ambil dari indeks pertama
        cell: ({ row }) => {
          const dos = row.original.inbound_dos;
          const receiptNo =
            dos && dos.length > 0 ? dos[0].add_to_receipt_number : null;

          return (
            <div className="font-medium text-slate-700">
              {receiptNo ? (
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-100">
                  {receiptNo}
                </span>
              ) : (
                <span className="text-slate-400 italic text-xs">
                  Not Available
                </span>
              )}
            </div>
          );
        },
      },
      {
        header: "Principal",
        id: "principal",
        cell: ({ row }) => {
          const dos = row.original.inbound_dos;
          if (dos && dos.length > 0) {
            return dos[0].principal || "-";
          }
          return "-";
        },
      },
      {
        accessorKey: "inbound_type",
        header: "Inbound Type",
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
          const item = row.original;
          const sjList = Array.isArray(item?.inbound_dos)
            ? item.inbound_dos
            : [];
          const hasSJ = sjList.length > 0;
          const isAllSJCancelled =
            hasSJ &&
            sjList.every(
              (sj: any) =>
                String(sj?.integration_status || "").toUpperCase() ===
                "CANCELLED",
            );
          const canDeleteByInboundStatus = [
            "CREATED",
            "WAITING FOR REVISION",
            "UNLOADING",
            "FAILED",
          ].includes(item.status);
          const canDelete = canDeleteByInboundStatus && isAllSJCancelled;
          const canCancelInbound =
            canDeleteByInboundStatus &&
            String(item.status || "").toUpperCase() !== "CANCELLED" &&
            isAllSJCancelled;

          const actionList = [
            {
              label: "Detail",
              icon: FaEye,
              onClick: () => handleDetail(item),
              className: "text-green-600",
              visible: true,
            },
            {
              label: "Edit",
              icon: FaEdit,
              onClick: () => handleUpdate(item),
              className: "text-blue-600",
              visible: canDeleteByInboundStatus,
            },
            {
              label: canCancelInbound
                ? "Cancel Inbound Plan"
                : "Cancel Inbound Plan (Semua SJ harus CANCELLED)",
              icon: FaBan,
              onClick: () => handleCancelInboundPlan(item),
              className: canCancelInbound ? "text-orange-600" : "text-slate-400",
              disabled: !canCancelInbound,
              visible:
                canDeleteByInboundStatus &&
                String(item.status || "").toUpperCase() !== "CANCELLED",
            },
            {
              label: canDelete
                ? "Delete"
                : "Delete (Semua SJ harus CANCELLED)",
              icon: FaTrash,
              onClick: () => handleDelete(item),
              className: canDelete ? "text-red-600" : "text-slate-400",
              disabled: !canDelete,
              visible: canDeleteByInboundStatus,
            },
          ].filter((a) => a.visible);

          return <ActionMenu actions={actionList} />;
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pageIndex, pageSize, globalFilter, filteredStatus],
  );

  const handleDetail = (data: any) => {
    navigate("/inbound_planning/process", {
      state: { data, mode: "detail" },
    });
  };

  const handleUpdate = (data: any) => {
    navigate("/inbound_planning/process", {
      state: { data, mode: "edit", title: "Update Inbound Planning" },
    });
  };

  const handleCancelInboundPlan = async (item: any) => {
    const inboundNo = item?.inbound_number || item?.id || "-";
    const sjList = Array.isArray(item?.inbound_dos) ? item.inbound_dos : [];
    const hasSJ = sjList.length > 0;
    const isAllSJCancelled =
      hasSJ &&
      sjList.every(
        (sj: any) =>
          String(sj?.integration_status || "").toUpperCase() === "CANCELLED",
      );

    if (!isAllSJCancelled) {
      showErrorToast(
        "Cancel Inbound Plan hanya bisa jika semua SJ berstatus CANCELLED.",
      );
      return;
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Cancel Inbound Plan",
      html: `Anda yakin ingin cancel Inbound Plan <b>${inboundNo}</b>?<br/>Masukkan catatan pembatalan:`,
      input: "textarea",
      inputPlaceholder: "Notes / alasan cancel...",
      inputAttributes: {
        "aria-label": "Notes cancel inbound plan",
      },
      showCancelButton: true,
      confirmButtonText: "Ya, Cancel!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ea580c",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      inputValidator: (value) => {
        if (!String(value || "").trim()) {
          return "Notes wajib diisi";
        }
        return null;
      },
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "100000";
      },
    });

    if (!result.isConfirmed) return;

    try {
      await cancelInboundPlanService(
        item.id,
        String(result.value || "").trim(),
      );
      showSuccessToast(`Inbound Plan ${inboundNo} berhasil di-cancel`);
      refreshList();
    } catch (error: any) {
      console.error(error);
      showErrorToast(error?.message || "Gagal Cancel Inbound Plan");
    }
  };

  const handleDelete = (item: any) => {
    const sjList = Array.isArray(item?.inbound_dos) ? item.inbound_dos : [];
    const hasSJ = sjList.length > 0;
    const isAllSJCancelled =
      hasSJ &&
      sjList.every(
        (sj: any) =>
          String(sj?.integration_status || "").toUpperCase() === "CANCELLED",
      );

    if (!isAllSJCancelled) return;

    showConfirmDialog(
      async () => {
        try {
          await deleteInboundPlanService(item.id);
          showSuccessToast("Inbound Plan berhasil dihapus");
          refreshList();
        } catch (error: any) {
          console.error(error);
          showErrorToast(error?.message || "Gagal menghapus Inbound Plan");
        }
      },
      {
        title: "Confirm Delete",
        text: "Anda yakin ingin menghapus data ini?",
        confirmButtonText: "Yes, Delete!",
        cancelButtonText: "No, Cancel",
      },
    );
  };

  const mappedList = list || [];

  return (
    <div className="relative">
      {isLoading && <ActIndicator />}

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
