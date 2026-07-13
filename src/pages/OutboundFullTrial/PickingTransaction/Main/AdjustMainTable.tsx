import { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";
import {
  FaBoxOpen,
  FaCheck,
  FaPrint,
  FaTasks,
} from "react-icons/fa";

import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { OutboundDo } from "../Helper/doTypes";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { mapPickingTransactions } from "../Helper/mappedList";
import { formatDateIndo } from "../../../../helper/FormatDate";
import TableComponent from "../../../../components/tables/ActionTable/TableComponent";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import {
  ActionMenu,
  MemoCell,
  SealModal,
  ShipConfirmQtyModal,
  UploadModal,
} from "../components";
import { usePickingActions } from "../Hook/usePickingActions";

type Props = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  filteredStatus?: any;
};

const AdjustTableTransactionPicking = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
}: Props) => {
  const user = usePersistAuthStore((state) => state.user);
  const roleName = user?.role?.name;

  const [searchParams, setSearchParams] = useSearchParams();
  const { fetchUsingPagination, list, pagination, updateData, isLoading } =
    useStoreOutboundDeliveryOrder();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(10);

  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({ globalFilter, filteredStatus });

  // 🔹 Panggil Custom Hook Bisnis Logik
  const actions = usePickingActions({
    currentPage,
    pageSize,
    globalFilter,
    filteredStatus,
    fetchUsingPagination,
    updateData,
  });

  // --- EFFECT: SYNC FILTERS & PAGINATION ---
  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);
    if (newSize !== pageSize) setPageSize(newSize);
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (
      prevFiltersRef.current.globalFilter !== globalFilter ||
      prevFiltersRef.current.filteredStatus !== filteredStatus
    ) {
      prevFiltersRef.current = { globalFilter, filteredStatus };
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: true });
    }
  }, [globalFilter, filteredStatus]);

  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: currentPage,
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
    });
  }, [
    fetchUsingPagination,
    currentPage,
    pageSize,
    globalFilter,
    filteredStatus,
  ]);

  const mappedList: OutboundDo[] = useMemo(() => {
    return mapPickingTransactions(list || []).map((item, index) => ({
      ...item,
      no: pageIndex * pageSize + (index + 1),
    }));
  }, [list, pageIndex, pageSize]);

  useEffect(() => {
    if (mappedList.length === 0) return;
    actions.syncPickReleaseStatuses(mappedList);
  }, [mappedList, actions.syncPickReleaseStatuses]);

  // --- COLUMNS DEFINITION ---
  const columns: ColumnDef<OutboundDo>[] = useMemo(
    () => [
      { accessorKey: "outbound_do_number", header: "DO Number" },
      {
        accessorKey: "outbound_memos",
        header: "Memo Number",
        cell: ({ row }) => (
          <MemoCell memos={row.original.outbound_memos || []} />
        ),
      },
      { accessorKey: "outbound_type", header: "Type" },
      { accessorKey: "origin", header: "Origin" },
      {
        accessorKey: "delivery_date",
        header: "Delivery Date",
        cell: ({ row }) => formatDateIndo(row.original.delivery_date),
      },
      {
        accessorKey: "status",
        header: "Status DO",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_DO}
            variant="solid"
            size="sm"
          />
        ),
      },
      {
        accessorKey: "seal_number",
        header: "Seal Number",
        cell: ({ row }) => (
          <span className="text-slate-700">{row.original.seal_number}</span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const { status, outbound_type, id } = row.original;
          const isPickReleaseDone = actions.pickReleaseStatusMap[id] === true;
          const canAction = ["SUPERVISOR", "MANAGER", "superadmin"].includes(
            roleName || "",
          );
          if (!canAction) return null;

          const actionList = [
            {
              label: "Detail Picking",
              icon: FaTasks,
              onClick: () => actions.handleAdjust(row.original),
              visible: status !== "PENDING" && status !== "COMPLETED",
            },
            {
              label: "Print Surat Jalan",
              icon: FaPrint,
              onClick: () => actions.handlePrintAction(row.original),
              visible: status === "APPROVED_LOAD",
            },
            {
              label: "Ship Confirm AMO",
              icon: FaCheck,
              onClick: () => actions.handleShipConfirmInternalAMO(row.original),
              visible: status === "APPROVED_LOAD" && outbound_type === "AMO",
              className: "text-emerald-600",
            },
            {
              label: "Pick Release",
              icon: FaBoxOpen,
              onClick: () => actions.handlePickRelease(row.original),
              visible: outbound_type === "SUBDIST",
              // && status === "APPROVED",
              disabled: isPickReleaseDone,
              className: isPickReleaseDone
                ? "text-slate-400"
                : "text-indigo-600",
            },
            {
              label: "Ship Confirm Subdist",
              icon: FaCheck,
              onClick: () => actions.handleShipConfirmSubdistFlow(row.original),
              visible: outbound_type === "SUBDIST", 
              // && status === "APPROVED_LOAD",
              disabled: !isPickReleaseDone,
              className: isPickReleaseDone
                ? "text-emerald-600"
                : "text-slate-400",
            },
          ].filter((a) => a.visible);

          return <ActionMenu actions={actionList} />;
        },
      },
    ],
    [currentPage, pageSize, roleName, actions],
  );

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

      {/* Modals berkurang kerumitannya karena state diurus oleh hook */}
      <SealModal
        isOpen={actions.showSealModal}
        onClose={() => actions.setShowSealModal(false)}
        selectedDO={actions.selectedDO}
        sealInput={actions.sealInput}
        setSealInput={actions.setSealInput}
        onConfirm={actions.handleConfirmSeal}
      />

      <UploadModal
        isOpen={actions.showUploadModal}
        onClose={actions.handleCloseUploadModal}
        selectedDO={actions.selectedDO}
        onUploadConfirm={actions.handleUploadManifestFile}
        continueToShipConfirm={actions.pendingShipConfirmAfterUpload}
      />

      <ShipConfirmQtyModal
        isOpen={actions.showQtyModal}
        onClose={actions.handleCloseShipConfirmQtyModal}
        doDetail={actions.qtyModalData}
        isProcessing={actions.isSubmittingQty}
        onConfirm={actions.handleExecuteShipConfirmWithQty}
      />
    </div>
  );
};

export default AdjustTableTransactionPicking;
