import { useEffect, useMemo, useState, useRef } from "react";
// Tambahkan FaChevronRight & FaChevronDown untuk ikon Expand table
import {
  FaEye,
  FaTasks,
  FaTrash,
  FaChevronRight,
  FaChevronDown,
} from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate, useSearchParams } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import Swal from "sweetalert2";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import ActIndicator from "../../../../components/ui/activityIndicator";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import MainTable from "../Table/MainTable";

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
  deliveryCategory: string;
  deliveryDate: string;
  memoId: string[];
  outboundMemos: OutboundMemo[];
  outboundMemosDetailed: any[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type MenuTableProps = {
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  onDetail?: (id: string) => void;
  onRefresh?: () => void;
  filteredStatus?: any;
  filteredTypeOutbound?: any;
  filteredDoNumber?: string;
  filteredDestination?: string;
};

const matchesDoSearch = (item: any, filter: string) => {
  const query = filter.trim().toLowerCase();
  if (!query) return true;

  const memoTexts = (item.outbound_memos || []).flatMap((memo: any) => [
    memo.outbound_memo_number,
    memo.so_number,
    memo.destination,
    memo.ship_to,
    memo.origin,
    memo.requestor,
    ...(memo.assigned_pickings || []).map((p: any) => p.picking_name),
    ...(memo.outbound_memo_items || []).flatMap((mi: any) => [
      mi.item?.sku,
      mi.item?.item_number,
      mi.item?.description,
    ]),
  ]);

  const searchable = [
    item.outbound_do_number,
    item.origin,
    item.outbound_type,
    item.status,
    item.seal_number,
    item.license_plate,
    item.driver_name,
    ...memoTexts,
  ];

  return searchable.some(
    (value) => value != null && String(value).toLowerCase().includes(query),
  );
};

// --- KOMPONEN MEMO CELL SEBAGAI SUB-COMPONENT (Expanded Row) ---
const MemoCell = ({
  memos,
  outboundType,
}: {
  memos: any[];
  outboundType?: string;
}) => {
  const isSubdistDo = String(outboundType || "").toUpperCase() === "SUBDIST";

  if (!memos || memos.length === 0) {
    return (
      <div className="p-4 text-center">
        <span className="text-slate-400 italic text-xs font-medium">
          Belum ada data memo pada DO ini.
        </span>
      </div>
    );
  }

  return (
    <div className="p-3 bg-slate-50/60 flex flex-col gap-3 rounded-b-xl">
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <div className="w-1 h-3.5 bg-blue-600 rounded-full"></div>
        <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">
          Detail Memos & Picking Status
        </h4>
      </div>

      <div className="flex flex-col gap-3">
        {memos
          .filter((memo) => memo.status !== "CANCELLED")
          .map((memo) => {
            const assignedUsers = memo.assigned_pickings || [];
            const isAssigned = assignedUsers.length > 0;
            const pickings = (memo.transaction_pickings || []).filter(
              (p: any) => p.status !== "CANCELLED",
            );

            // Mapping item memo untuk pencarian assigned_gate_load / pallet loading
            const memoItems = memo.outbound_memo_items || [];
            const isSubdistMemo =
              isSubdistDo ||
              String(memo.type || "").toUpperCase() === "SUBDIST";
            const soNumber = memo.so_number != null && memo.so_number !== ""
              ? String(memo.so_number)
              : null;

            const totalSKU = pickings.length;
            const scannedSKUCount = pickings.filter((tp: any) => {
              const activeScans = (tp.transactionScanPicking || []).filter(
                (s: any) => s.status !== "CANCELLED",
              );
              return activeScans.length > 0;
            }).length;

            const remainingSKU = totalSKU - scannedSKUCount;
            const isAllScanned = totalSKU > 0 && remainingSKU === 0;

            return (
              <div
                key={memo.id}
                className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden"
              >
                {/* --- HEADER MEMO (COMPACT GRID & INFORMASI DESTINATION) --- */}
                <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="p-1 bg-blue-100 rounded-md flex-shrink-0">
                        <svg
                          width="14"
                          height="14"
                          className="text-blue-600"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M16 13H8" />
                          <path d="M16 17H8" />
                          <path d="M10 9H8" />
                        </svg>
                      </div>

                      {/* Outbound Memo Number */}
                      <span className="text-xs font-black text-slate-800 tracking-tight">
                        {memo.outbound_memo_number}
                      </span>

                      {/* Badge Destination Kota */}
                      {memo.destination && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          📍 {memo.destination}
                        </span>
                      )}

                      {/* Status Scan SKU */}
                      <div className="flex items-center gap-1">
                        {remainingSKU > 0 ? (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                            {remainingSKU} SKU Belum Scan
                          </span>
                        ) : isAllScanned ? (
                          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Semua SKU Selesai
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs whitespace-nowrap">
                      Total {totalSKU} SKU
                    </span>
                  </div>

                  {/* SO Number — field di dalam card memo (SUBDIST) */}
                  {isSubdistMemo && (
                    <div className="flex items-center gap-2 text-[11px] border-t border-slate-200/50 pt-1.5">
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 shrink-0">
                        SO Number
                      </span>
                      <span
                        className="font-mono font-bold text-emerald-800 tracking-tight"
                        title={soNumber || undefined}
                      >
                        {soNumber || "-"}
                      </span>
                    </div>
                  )}

                  {/* Ship To Address (Inline & Compact) */}
                  {memo.ship_to && (
                    <div className="flex items-start gap-1 text-[11px] text-slate-500 border-t border-slate-200/50 pt-1.5">
                      <span className="text-slate-400 flex-shrink-0">🏢</span>
                      <span
                        className="line-clamp-1 leading-tight"
                        title={memo.ship_to}
                      >
                        <strong className="text-slate-700 font-bold">
                          Ship To:
                        </strong>{" "}
                        {memo.ship_to}
                      </span>
                    </div>
                  )}

                  {/* Helper Assignment */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                      Helper
                    </span>
                    {isAssigned ? (
                      <div className="flex flex-wrap gap-1">
                        {assignedUsers.map((user: any, idx: number) => (
                          <span
                            key={user.id || idx}
                            className="text-[9px] font-bold text-blue-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded flex items-center gap-1 shadow-2xs"
                          >
                            👤 {user.picking_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 italic">
                        ⚠️ Belum ada Helper ditugaskan
                      </span>
                    )}
                  </div>
                </div>

                {/* --- DAFTAR BARANG (BODY) --- */}
                <div className="p-3">
                  {pickings.length === 0 ? (
                    <div className="p-4 text-center text-red-400 text-xs italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      Belum ada Picking Suggestion dibuat!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {pickings.map((tp: any) => {
                        const activeScans = (
                          tp.transactionScanPicking || []
                        ).filter((s: any) => s.status !== "CANCELLED");
                        const isDone = activeScans.length > 0;

                        // Fallback Kode Pallet
                        const scanPalletUseCode =
                          activeScans[0]?.palletUse?.pallet_code;
                        const scanPalletSourceCode =
                          activeScans[0]?.palletSource?.pallet_code;

                        const matchingMemoItem = memoItems.find(
                          (mi: any) => mi.item_id === tp.item_id,
                        );
                        const assignedGatePalletCode =
                          matchingMemoItem?.assigned_gate_load?.[0]?.pallet
                            ?.pallet_code;

                        const activePalletCode =
                          scanPalletUseCode ||
                          assignedGatePalletCode ||
                          scanPalletSourceCode ||
                          null;

                        return (
                          <div
                            key={tp.id}
                            className={`p-2.5 rounded-lg border transition-all ${
                              isDone
                                ? "bg-white border-emerald-200/80 shadow-2xs"
                                : "bg-white border-slate-200 shadow-2xs hover:border-blue-300"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2 mb-2">
                              <div className="flex flex-col gap-0.5 max-w-[65%]">
                                <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                  {tp.item?.sku}
                                </span>
                                <p className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-1">
                                  {tp.item?.description}
                                </p>

                                {/* Informasi Pallet */}
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-1 py-0.5 rounded border border-slate-200">
                                    Pallet
                                  </span>
                                  {activePalletCode ? (
                                    <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                                      📦 {activePalletCode}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-slate-400 italic">
                                      Belum ada
                                    </span>
                                  )}
                                </div>
                              </div>

                              {isDone ? (
                                <div className="flex flex-col items-end">
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded font-black flex items-center gap-0.5 border border-emerald-200">
                                    ✅ SCAN SELESAI
                                  </span>
                                  <span className="text-[8px] text-emerald-600 font-bold mt-0.5">
                                    Oleh: {activeScans[0].user_name}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[9px] px-2 py-0.5 rounded font-black animate-pulse">
                                    ⏳ BELUM SCAN
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Section Zone, Bin, & Quantity */}
                            <div
                              className={`grid grid-cols-2 gap-2 p-2 rounded-md border ${
                                isDone
                                  ? "bg-emerald-50/20 border-emerald-100/60"
                                  : "bg-slate-50/70 border-slate-100"
                              }`}
                            >
                              <div className="flex flex-col justify-center">
                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                  Zone / Bin
                                </span>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-black text-slate-700 line-clamp-1">
                                    {tp.sourceWarehouseSub?.name || "-"}
                                  </span>
                                  <span className="text-slate-300 text-[10px]">
                                    /
                                  </span>
                                  <span className="text-xs font-black text-blue-600 line-clamp-1">
                                    {tp.sourceBin?.name || "-"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-3 border-l border-slate-200/60 pl-2">
                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                    Plan
                                  </span>
                                  <span className="text-xs font-black text-slate-800">
                                    {tp.quantity}{" "}
                                    <span className="text-[9px] text-slate-500 font-bold uppercase">
                                      {tp.uom}
                                    </span>
                                  </span>
                                </div>

                                <div className="flex flex-col items-end">
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                    Scan
                                  </span>
                                  <span
                                    className={`text-xs font-black ${
                                      isDone
                                        ? "text-emerald-600"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {isDone
                                      ? activeScans[0].quantity_picked
                                      : "0"}{" "}
                                    <span className="text-[9px] font-bold uppercase opacity-70">
                                      {tp.uom}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {isDone && (
                              <div className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-400 bg-emerald-50/40 py-1 px-2 rounded w-fit border border-emerald-100/40">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                                <span>
                                  Discan:{" "}
                                  <strong className="text-slate-600">
                                    {new Date(
                                      activeScans[0].createdAt,
                                    ).toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "short",
                                    })}
                                    ,{" "}
                                    {new Date(
                                      activeScans[0].createdAt,
                                    ).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </strong>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

const AdjustTableDO = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
  filteredTypeOutbound,
  filteredDoNumber,
  filteredDestination,
}: MenuTableProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = usePersistAuthStore((state) => state.user);
  const { fetchUsingPagination, list, pagination, isLoading } =
    useStoreOutboundDeliveryOrder();

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(10);

  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    filteredStatus,
    filteredTypeOutbound,
  });

  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);

    if (newSize !== pageSize) {
      setPageSize(newSize);
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const hasFilterChanged =
      prevFiltersRef.current.filteredStatus !== filteredStatus ||
      prevFiltersRef.current.filteredTypeOutbound !== filteredTypeOutbound;

    if (hasFilterChanged) {
      prevFiltersRef.current = {
        filteredStatus,
        filteredTypeOutbound,
      };

      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredStatus, filteredTypeOutbound]);

  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: currentPage,
      limit: pageSize,
      status: filteredStatus || "",
      outbound_type: filteredTypeOutbound || "",
    });
  }, [
    fetchUsingPagination,
    currentPage,
    pageSize,
    filteredStatus,
    filteredTypeOutbound,
  ]);

  const handleDetail = (id: string) => {
    navigate("/outbound_do/detail", {
      state: { data: id, mode: "detail", title: "Detail Memo" },
    });
  };

  const handleAdjust = (id: string, status: string) => {
    navigate("/outbound_do/picking_suggestion", {
      state: {
        data: id,
        mode: "suggestion",
        title: "Picking Suggestion List",
        status,
      },
    });
  };

  const handleDeleteDO = async (id: string) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Cancel DO",
      text: `Yakin cancel DO ini ?`,
      showCancelButton: true,
      confirmButtonText: "Ya, batalkan",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axiosInstance.patch(`outbound-do/${id}/cancel`);
      showSuccessToast("Delivery Order berhasil dibatalkan");

      if (fetchUsingPagination) {
        fetchUsingPagination({
          page: currentPage,
          limit: pageSize,
          status: filteredStatus || "",
          outbound_type: filteredTypeOutbound || "",
        });
      }
    } catch (err: any) {
      console.error("Error canceling DO via axiosInstance:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan saat membatalkan DO";
      showErrorToast(`Gagal cancel DO: ${errorMsg}`);
    }
  };

  const roleName = user?.role?.name;
  const canActionDO =
    roleName === "SUPERVISOR" ||
    roleName === "MANAGER" ||
    roleName === "superadmin";

  const columns: ColumnDef<MemoData>[] = useMemo(
    () => [
      // TAMBAHAN KOLOM EXPANDER DI SINI
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
      { accessorKey: "outboundDoNumber", header: "DO Number" },
      { accessorKey: "outboundType", header: "Type Outbound" },
      { accessorKey: "origin", header: "Origin" },
      {
        accessorKey: "outboundMemos",
        header: "Memo Count",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-700">
            {row.original.outboundMemosDetailed?.length || 0} Memo
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.status}
            colorMap={STATUS_MAP_DO}
            variant="solid"
            size="sm"
          />
        ),
      },
      { accessorKey: "deliveryDate", header: "Delivery Date" },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const deletable =
            !Array.isArray(row.original.memoId) ||
            row.original.memoId.length === 0;

          const isCancelled = row.original.status === "CANCELLED";
          return (
            <div className="flex gap-3">
              <FaEye
                className="size-5 cursor-pointer text-green-600 hover:scale-110 transition"
                onClick={() => handleDetail(row.original.id)}
                title="Detail"
              />

              {canActionDO && (
                <>
                  <FaTasks
                    className="size-5 cursor-pointer text-yellow-600 hover:scale-110 transition"
                    onClick={() =>
                      handleAdjust(row.original.id, row.original.status)
                    }
                    title="PickingSuggestion"
                  />

                  <FaTrash
                    className={`size-5 transition ${
                      deletable && !isCancelled
                        ? "cursor-pointer text-red-600 hover:scale-110"
                        : "opacity-50 cursor-not-allowed pointer-events-none text-gray-400"
                    }`}
                    onClick={
                      deletable && !isCancelled
                        ? () => handleDeleteDO(row.original.id)
                        : undefined
                    }
                    title={
                      !deletable
                        ? "Cannot delete - DO has memos"
                        : isCancelled
                          ? "Cannot delete - DO is cancelled"
                          : "Delete"
                    }
                  />
                </>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roleName, currentPage, pageSize],
  );

  const filteredList = useMemo(() => {
    return (list || []).filter((item: any) => {
      if (filteredDoNumber && item.outbound_do_number !== filteredDoNumber) {
        return false;
      }

      if (filteredDestination) {
        const hasDestination = (item.outbound_memos || []).some(
          (memo: any) => memo.destination === filteredDestination,
        );
        if (!hasDestination) return false;
      }

      if (globalFilter && !matchesDoSearch(item, globalFilter)) return false;

      return true;
    });
  }, [list, globalFilter, filteredDoNumber, filteredDestination]);

  const mappedList = filteredList.map((item: any, index: number) => ({
    no: pageIndex * pageSize + (index + 1),
    id: item.id,
    outboundDoNumber: item.outbound_do_number || "",
    expedition: item.expedition || "",
    origin: item.origin || "-",
    licensePlate: item.license_plate || "-",
    driverName: item.driver_name || "-",
    driverPhone: item.driver_phone || "-",
    status: item.status || "PENDING",
    outboundType: item.outbound_type || "",
    deliveryCategory: item.delivery_category || "-",
    deliveryDate: new Date(item.delivery_date).toLocaleDateString("en-GB"),
    memoId: item.memo_id || [],
    outboundMemosDetailed: item.outbound_memos || [],
    outboundMemos: (item.outbound_memos || []).map((memo: any) => ({
      id: memo.id,
      outbound_memo_number: memo.outbound_memo_number,
      has_do: memo.has_do ?? false,
      status: memo.status ?? "UNKNOWN",
    })),
    createdAt: item.createdAt || null,
    updatedAt: item.updatedAt || null,
    deletedAt: item.deletedAt || null,
  }));

  return (
    <div className="flex flex-col gap-4">
      {isLoading && <ActIndicator />}

      <MainTable
        data={mappedList}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        renderSubComponent={({ row }) => (
          <MemoCell
            memos={row.original.outboundMemosDetailed}
            outboundType={row.original.outboundType}
          />
        )}
      />
    </div>
  );
};

export default AdjustTableDO;
