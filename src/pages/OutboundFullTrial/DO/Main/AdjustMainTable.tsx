import { useEffect, useMemo, useState, useRef } from "react";
import { FaEye, FaTasks, FaTrash } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate, useSearchParams } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import Swal from "sweetalert2";
import { showErrorToast } from "../../../../components/toast";
import { EndPoint } from "../../../../utils/EndPoint";
import TableComponent from "../../../../components/tables/ActionTable/TableComponent";
import ActIndicator from "../../../../components/ui/activityIndicator";

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
};

const AdjustTableDO = ({
  globalFilter,
  setGlobalFilter,
  filteredStatus,
  filteredTypeOutbound,
}: MenuTableProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { fetchUsingPagination, list, pagination, isLoading } =
    useStoreOutboundDeliveryOrder();

  // 🔹 Inisialisasi dari URL (agar saat Back, nilai ini tetap ada)
  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(10);

  // 🔹 Ref untuk deteksi Initial Mount dan Perubahan Filter
  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    globalFilter,
    filteredStatus,
    filteredTypeOutbound,
  });

  // 🔹 Handler untuk update URL ketika halaman berubah
  const handlePageChange = (newPageIndex: number, newSize: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", (newPageIndex + 1).toString());
    setSearchParams(newParams);

    if (newSize !== pageSize) {
      setPageSize(newSize);
    }
  };

  // 🔹 Logika Reset ke Halaman 1 HANYA jika filter diubah manual
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const hasFilterChanged =
      prevFiltersRef.current.globalFilter !== globalFilter ||
      prevFiltersRef.current.filteredStatus !== filteredStatus ||
      prevFiltersRef.current.filteredTypeOutbound !== filteredTypeOutbound;

    if (hasFilterChanged) {
      prevFiltersRef.current = {
        globalFilter,
        filteredStatus,
        filteredTypeOutbound,
      };

      // Reset ke halaman 1 di URL
      const newParams = new URLSearchParams(searchParams);
      newParams.set("page", "1");
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter, filteredStatus, filteredTypeOutbound]);

  // 🔹 Fetch data menggunakan nilai dari URL (currentPage)
  useEffect(() => {
    if (!fetchUsingPagination) return;
    fetchUsingPagination({
      page: currentPage, // Gunakan currentPage dari URL
      limit: pageSize,
      search: globalFilter || "",
      status: filteredStatus || "",
      outbound_type: filteredTypeOutbound || "",
    });
  }, [
    fetchUsingPagination,
    currentPage, // 🔹 Trigger fetch saat URL param 'page' berubah
    pageSize,
    globalFilter,
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
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${EndPoint}outbound-do/${id}/cancel`, {
        method: "PATCH",
        headers,
      });

      if (!res.ok) {
        const txt = await res.text();
        showErrorToast(`Gagal cancel DO: ${res.status} ${txt}`);
        return;
      }

      if (fetchUsingPagination) {
        fetchUsingPagination({
          page: currentPage,
          limit: pageSize,
          search: globalFilter || "",
          status: filteredStatus || "",
        });
      }
    } catch (err) {
      console.error(err);
      showErrorToast("Terjadi kesalahan saat membatalkan DO");
    }
  };

  const MemoCell = ({ memos }: { memos: any[] }) => {
    const [openMemoId, setOpenMemoId] = useState<string | null>(null);

    if (!memos || memos.length === 0) {
      return (
        <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center">
          <span className="text-slate-400 italic text-xs font-medium">
            Belum ada data memo
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3 min-w-[350px]">
        {memos
          .filter((memo) => memo.status !== "CANCELLED")
          .map((memo) => {
            const isOpen = openMemoId === memo.id;
            const assignedUsers = memo.assigned_pickings || [];
            const isAssigned = assignedUsers.length > 0;
            const pickings = (memo.transaction_pickings || []).filter(
              (p: any) => p.status !== "CANCELLED",
            );

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
                className={`rounded-xl transition-all duration-300 border-2 ${isOpen ? "border-blue-500 shadow-lg" : "border-slate-200 hover:border-slate-300"}`}
              >
                {/* --- HEADER MEMO --- */}
                <div
                  onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
                  className={`p-4 cursor-pointer flex items-start justify-between gap-4 ${
                    isOpen ? "bg-blue-50/50" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  {/* SISI KIRI: Memo Info & Helpers (Gunakan flex-grow agar mengambil ruang yang tersedia) */}
                  <div className="flex-grow flex flex-col gap-1 overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
                        <svg
                          width="16"
                          height="16"
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
                      <span className="text-sm font-black text-slate-800 tracking-tight flex-shrink-0">
                        {memo.outbound_memo_number}
                      </span>

                      {/* INFO STATUS SKU */}
                      <div className="flex items-center gap-1.5">
                        {remainingSKU > 0 ? (
                          <span className="text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                            {remainingSKU} SKU Belum Scan
                          </span>
                        ) : isAllScanned ? (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                            Semua SKU sudah di-Scan
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* HELPER LIST */}
                    <div className="flex flex-wrap items-center gap-y-2 gap-x-1.5 mt-2">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[9px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">
                          Helper
                        </span>
                      </div>

                      {isAssigned ? (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedUsers.map((user: any, idx: number) => (
                            <span
                              key={user.id || idx}
                              className="text-[10px] font-bold text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm whitespace-nowrap"
                            >
                              👤 {user.picking_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-red-500 bg-grey-50 px-2 py-0.5 rounded-md border border-red-100 italic">
                          ⚠️ Belum ada Helper ditugaskan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* SISI KANAN: Total SKU & Arrow (Gunakan flex-shrink-0 agar ukuran tetap) */}
                  <div className="flex flex-col items-end justify-start gap-3 flex-shrink-0 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 bg-white border px-2.5 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                      {totalSKU} SKU
                    </span>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* --- DAFTAR BARANG (BODY) --- */}
                {isOpen && (
                  <div className="bg-slate-50/50 p-3 flex flex-col gap-3 border-t-2 border-slate-100">
                    {pickings.length === 0 ? (
                      <div className="p-6 text-center text-red-400 text-xs italic bg-white rounded-xl border border-dashed border-slate-200">
                        Belum ada Picking Suggestion dibuat!
                      </div>
                    ) : (
                      pickings.map((tp: any) => {
                        const activeScans = (
                          tp.transactionScanPicking || []
                        ).filter((s: any) => s.status !== "CANCELLED");
                        const isDone = activeScans.length > 0;

                        return (
                          <div
                            key={tp.id}
                            className={`p-4 rounded-xl border transition-all duration-200 ${
                              isDone
                                ? "bg-white border-emerald-100 shadow-sm"
                                : "bg-white border-slate-200 shadow-sm hover:border-blue-200"
                            }`}
                          >
                            {/* Info Utama Barang */}
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-col gap-0.5 max-w-[65%]">
                                <span className="text-sm font-black text-slate-900 uppercase tracking-wide">
                                  {tp.item?.sku}
                                </span>
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                  {tp.item?.description}
                                </p>
                              </div>

                              {/* Label Status */}
                              {isDone ? (
                                <div className="flex flex-col items-end">
                                  <span className="bg-emerald-200 text-black-200 text-[10px] px-2.5 py-1 rounded-lg font-black flex items-center gap-1 shadow-sm shadow-emerald-100">
                                    ✅ SELESAI SCAN
                                  </span>
                                  <span className="text-[9px] text-emerald-600 font-bold mt-1.5 px-1">
                                    Oleh: {activeScans[0].user_name}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end">
                                  <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] px-2.5 py-1 rounded-lg font-black animate-pulse">
                                    ⏳ BELUM DI-SCAN
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Detail Lokasi & Jumlah (Section Box Samar) */}
                            <div
                              className={`grid grid-cols-2 gap-4 p-3 rounded-xl border ${
                                isDone
                                  ? "bg-emerald-50/30 border-emerald-100/50"
                                  : "bg-slate-50 border-slate-100"
                              }`}
                            >
                              {/* Lokasi Gudang */}
                              <div className="flex flex-col justify-center">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                                  Zone/ Bin
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-slate-700">
                                    {tp.sourceWarehouseSub?.name || "-"}
                                  </span>
                                  <span className="text-slate-300 text-xs">
                                    /
                                  </span>
                                  <span className="text-sm font-black text-blue-600">
                                    {tp.sourceBin?.name || "Area Umum"}
                                  </span>
                                </div>
                              </div>

                              {/* Jumlah Barang (Vertical Mode) */}
                              <div className="flex flex-col items-end gap-2 border-l border-slate-200/50 pl-4">
                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">
                                    Suggestion
                                  </span>
                                  <span className="text-sm font-black text-slate-800">
                                    {tp.quantity}{" "}
                                    <span className="text-[10px] text-slate-500 font-bold uppercase">
                                      {tp.uom}
                                    </span>
                                  </span>
                                </div>

                                <div className="w-full h-[1px] bg-slate-200/50"></div>

                                <div className="flex flex-col items-end">
                                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">
                                    Telah Di-Scan
                                  </span>
                                  <span
                                    className={`text-sm font-black ${
                                      isDone
                                        ? "text-emerald-600"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {isDone
                                      ? activeScans[0].quantity_picked
                                      : "0"}{" "}
                                    <span className="text-[10px] font-bold uppercase opacity-70">
                                      {tp.uom}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Catatan Waktu (Audit Trail) */}
                            {isDone && (
                              <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 bg-emerald-50/50 py-1.5 px-3 rounded-lg w-fit border border-emerald-100/50">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-sm shadow-emerald-200"></div>
                                <span>
                                  Berhasil di-scan pada{" "}
                                  <strong className="text-slate-600">
                                    {new Date(
                                      activeScans[0].createdAt,
                                    ).toLocaleDateString("id-ID", {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                    ,{" "}
                                    {new Date(
                                      activeScans[0].createdAt,
                                    ).toLocaleTimeString("id-ID", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    WIB
                                  </strong>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  const roleName = localStorage.getItem("role_name");
  const canActionDO =
    roleName === "SUPERVISOR" ||
    roleName === "MANAGER" ||
    roleName === "superadmin";

  const columns: ColumnDef<MemoData>[] = useMemo(
    () => [
      { accessorKey: "outboundDoNumber", header: "DO Number" },
      { accessorKey: "outboundType", header: "Type Outbound" },
      { accessorKey: "origin", header: "Origin" },
      {
        accessorKey: "outboundMemos",
        header: "Memo Number",
        cell: ({ row }) => (
          <MemoCell memos={row.original.outboundMemosDetailed || []} />
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

  const mappedList = (list || []).map((item: any, index: number) => ({
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


      <TableComponent
        data={mappedList}
        columns={columns}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex} // 🔹 Gunakan index dari URL
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange} // 🔹 Update URL lewat handler baru
      />
    </div>
  );
};

export default AdjustTableDO;
