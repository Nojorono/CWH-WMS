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

  const { fetchUsingPagination, list, pagination } =
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
    if (!memos || memos.length === 0)
      return (
        <span className="text-slate-400 italic text-xs">
          No memos available
        </span>
      );

    return (
      <div className="flex flex-col gap-2 min-w-[280px]">
        {memos
          .filter((memo) => memo.status !== "CANCELLED")
          .map((memo) => {
            const isOpen = openMemoId === memo.id;
            const pickingsRaw = Array.isArray(memo.transaction_pickings)
              ? memo.transaction_pickings
              : memo.transaction_pickings
                ? [memo.transaction_pickings]
                : [];

            const pickings = pickingsRaw.filter(
              (p: any) => p.status !== "CANCELLED",
            );

            return (
              <div
                key={memo.id}
                className={`group transition-all duration-200 border rounded-lg overflow-hidden ${isOpen ? "border-blue-400 shadow-md ring-1 ring-blue-100" : "border-slate-200 hover:border-slate-300 shadow-sm"}`}
              >
                <div
                  onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
                  className={`flex items-center justify-between p-2.5 cursor-pointer transition-colors ${isOpen ? "bg-blue-50" : "bg-white hover:bg-slate-50"}`}
                >
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      Memo No
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {memo.outbound_memo_number || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${pickings.length > 0 ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}
                    >
                      {pickings.length} Items
                    </span>
                    <div
                      className={`transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-600" : "text-slate-400"}`}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="bg-white border-t border-blue-100 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="max-h-[200px] overflow-y-auto divide-y divide-slate-100">
                      {pickings.length === 0 ? (
                        <div className="p-4 text-center text-xs text-red-400 italic">
                          No Suggestion Items yet in this memo
                        </div>
                      ) : (
                        pickings.map((tp: any) => (
                          <div
                            key={tp.id}
                            className="p-2.5 hover:bg-blue-50/30 transition-colors"
                          >
                            <div className="flex items-center gap-2 ml-2">
                              <span className="text-blue-600 truncate">
                                {tp.item?.sku}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <div className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 flex items-center">
                                <span className="text-[9px] text-slate-500 mr-1 font-medium uppercase">
                                  Qty
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  {tp.quantity}
                                </span>
                              </div>
                              <div className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 flex items-center">
                                <span className="text-[9px] text-slate-500 mr-1 font-medium uppercase">
                                  UOM
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  {tp.uom}
                                </span>
                              </div>
                              <div className="bg-slate-100 border border-slate-200 rounded px-2 py-0.5 flex items-center">
                                <span className="text-[9px] text-slate-500 mr-1 font-medium uppercase">
                                  Week
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  {tp.week_number}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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
