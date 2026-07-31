import { useEffect, useMemo, useRef, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "react-router-dom";
import {
  FaBoxOpen,
  FaCheck,
  FaChevronDown,
  FaChevronRight,
  FaEye,
  FaPrint,
  FaTasks,
} from "react-icons/fa";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { OutboundDo } from "../Helper/doTypes";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { mapPickingTransactions } from "../Helper/mappedList";
import { formatDateIndo } from "../../../../helper/FormatDate";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import {
  ActionMenu,
  MemoCell,
  SealModal,
  ShipConfirmQtyModal,
  UploadModal,
  IrSoCheckingOverlay,
} from "../components";
import { usePickingActions } from "../Hook/usePickingActions";
import { useShipConfirmStatusByDo } from "../Hook/useShipConfirmStatusByDo";
import MainTable from "../components/MainTable";

type Props = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  filteredStatus?: any;
  filteredDoNumber?: string;
  filteredTypeOutbound?: string;
};

const AdjustTableTransactionPicking = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
  filteredDoNumber,
  filteredTypeOutbound,
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
  const prevFiltersRef = useRef({
    globalFilter,
    filteredStatus,
    filteredTypeOutbound,
  });

  // 🔹 Panggil Custom Hook Bisnis Logik
  const actions = usePickingActions({
    currentPage,
    pageSize,
    globalFilter,
    filteredStatus,
    filteredTypeOutbound,
    fetchUsingPagination,
    updateData,
  });

  const { shipConfirmStatusMap, syncShipConfirmStatuses } =
    useShipConfirmStatusByDo();

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
      prevFiltersRef.current.filteredStatus !== filteredStatus ||
      prevFiltersRef.current.filteredTypeOutbound !== filteredTypeOutbound
    ) {
      prevFiltersRef.current = {
        globalFilter,
        filteredStatus,
        filteredTypeOutbound,
      };
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: true });
    }
  }, [globalFilter, filteredStatus, filteredTypeOutbound]);

  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: currentPage,
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
      outbound_type: filteredTypeOutbound || "",
    });
  }, [
    fetchUsingPagination,
    currentPage,
    pageSize,
    globalFilter,
    filteredStatus,
    filteredTypeOutbound,
  ]);

  const mappedList: OutboundDo[] = useMemo(() => {
    const filtered = (list || []).filter((item: any) => {
      if (filteredDoNumber && item.outbound_do_number !== filteredDoNumber) {
        return false;
      }
      return true;
    });

    return mapPickingTransactions(filtered).map((item, index) => ({
      ...item,
      no: pageIndex * pageSize + (index + 1),
    }));
  }, [list, pageIndex, pageSize, filteredDoNumber]);

  useEffect(() => {
    if (mappedList.length === 0) return;
    actions.syncPickReleaseStatuses(mappedList);
    syncShipConfirmStatuses(mappedList);
  }, [mappedList, actions.syncPickReleaseStatuses, syncShipConfirmStatuses]);

  // --- COLUMNS DEFINITION ---
  const columns: ColumnDef<OutboundDo>[] = useMemo(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <button
            onClick={row.getToggleExpandedHandler()}
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 transition-colors"
          >
            {row.getIsExpanded() ? (
              <FaChevronDown className="w-3 h-3 text-orange-500" />
            ) : (
              <FaChevronRight className="w-3 h-3" />
            )}
          </button>
        ),
      },
      { accessorKey: "outbound_do_number", header: "DO Number" },
      {
        accessorKey: "outbound_memos",
        header: "Memo Count",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-700">
            {row.original.outbound_memos?.length || 0} Memo
          </span>
        ),
      },
      { accessorKey: "outbound_type", header: "Type" },
      {
        accessorKey: "delivery_category",
        header: "Delivery Category",
        cell: ({ row }) => row.original.delivery_category || "-",
      },
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
          const { status, outbound_type, id, seal_number } = row.original;
          const isPickReleaseDone = actions.pickReleaseStatusMap[id] === true;
          const isPickReleaseLocked =
            actions.pickReleaseLockedMap[id] === true || isPickReleaseDone;
          const isShipConfirmDone = shipConfirmStatusMap[id] === true;
          const hasSealNumber = Boolean(seal_number?.trim());
          const canAction = ["SUPERVISOR", "MANAGER", "superadmin"].includes(
            roleName || "",
          );
          if (!canAction) return null;

          // Step wajib: Print Surat Jalan → input Seal Number (modal)
          // Setelah seal ada:
          //   AMO     → IR/SO -> Ship Confirm AMO
          //   SUBDIST → Pick Release → Ship Confirm Subdist
          const actionList = [
            {
              label: "Detail Picking",
              icon: FaEye,
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
              label: isShipConfirmDone
                ? "Ship Confirm AMO Done!"
                : "Need to Ship Confirm AMO",
              icon: FaCheck,
              onClick: () => actions.handleShipConfirmInternalAMO(row.original),
              visible: status === "APPROVED_LOAD" && outbound_type === "AMO",
              disabled: !hasSealNumber || isShipConfirmDone,
              className:
                hasSealNumber && !isShipConfirmDone
                  ? "text-emerald-600"
                  : "text-slate-400",
            },
            {
              label: "Pick Release",
              icon: FaBoxOpen,
              onClick: () => actions.handlePickRelease(row.original),
              visible:
                outbound_type === "SUBDIST" && status === "APPROVED_LOAD",
              disabled: !hasSealNumber || isPickReleaseLocked,
              className:
                hasSealNumber && !isPickReleaseLocked
                  ? "text-indigo-600"
                  : "text-slate-400",
            },
            {
              label: "Ship Confirm Subdist",
              icon: FaCheck,
              onClick: () => actions.handleShipConfirmSubdistFlow(row.original),
              visible:
                outbound_type === "SUBDIST" && status === "APPROVED_LOAD",
              disabled: !hasSealNumber || !isPickReleaseDone,
              className:
                hasSealNumber && isPickReleaseDone
                  ? "text-emerald-600"
                  : "text-slate-400",
            },
          ].filter((a) => a.visible);

          return <ActionMenu actions={actionList} />;
        },
      },
    ],
    [currentPage, pageSize, roleName, actions, shipConfirmStatusMap],
  );

  return (
    <div className="flex flex-col gap-4 relative">
      {isLoading && <ActIndicator />}

      <IrSoCheckingOverlay isOpen={actions.isCheckingIrSo} />

      <MainTable
        data={mappedList}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        // 3. OPER MEMOCELL SEBAGAI SUB COMPONENT DISINI
        renderSubComponent={({ row }) => (
          <MemoCell
            memos={row.original.outbound_memos || []}
            outboundDoId={row.original.id}
            outboundType={row.original.outbound_type}
            outboundDoStatus={row.original.status}
            sealNumber={row.original.seal_number}
          />
        )}
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
