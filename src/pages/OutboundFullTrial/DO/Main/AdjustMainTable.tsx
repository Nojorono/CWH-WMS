import { useEffect, useMemo, useState, useRef } from "react";
import { FaEye, FaTasks, FaTrash } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate, useSearchParams } from "react-router-dom"; // Tambahkan useSearchParams
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import Swal from "sweetalert2";
import { showErrorToast } from "../../../../components/toast";
import { EndPoint } from "../../../../utils/EndPoint";

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
      state: { data: id, mode: "suggestion", title: "Picking Suggestion List", status },
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

    if (!Array.isArray(memos) || memos.length === 0) {
      return (
        <div className="text-sm italic text-slate-400">No memos attached</div>
      );
    }

    return (
      <div className="flex flex-col gap-2 min-w-[250px]">
        {memos.map((memo) => {
          const isOpen = openMemoId === memo.id;

          let items: any[] = [];
          if (
            Array.isArray(memo.transaction_pickings) &&
            memo.transaction_pickings.length > 0
          ) {
            items = memo.transaction_pickings.map((tp: any) => ({
              id: tp.id,
              sku: tp.item?.sku ?? tp.item?.item_number ?? "-",
              quantity: tp.quantity ?? 0,
              uom: tp.uom ?? "-",
              week: tp.week_number ?? "-",
            }));
          } else if (
            Array.isArray(memo.outbound_memo_items) &&
            memo.outbound_memo_items.length > 0
          ) {
            items = memo.outbound_memo_items.map((mi: any) => ({
              id: mi.id,
              sku: mi.item?.sku ?? mi.item?.item_number ?? "-",
              quantity: mi.quantity_plan ?? 0,
              uom: mi.uom ?? "-",
              week: mi.week_number ?? "-",
            }));
          }

          return (
            <div
              key={memo.id}
              className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                isOpen
                  ? "border-blue-300 ring-1 ring-blue-100 shadow-sm"
                  : "border-slate-200"
              }`}
            >
              <div
                onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
                className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${
                  isOpen ? "bg-blue-50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                    Memo Number
                  </span>
                  <span className="text-xs font-semibold text-slate-800">
                    {memo.outbound_memo_number ?? memo.memo_number ?? memo.id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      items.length > 0
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {items.length} Items
                  </span>
                  <div
                    className={`transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <svg
                      width="12"
                      height="12"
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
                <div className="bg-white border-t border-blue-100 max-h-[200px] overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 italic">
                      No items found
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {items.map((it) => (
                        <div
                          key={it.id}
                          className="p-2 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-blue-600 break-all">
                              {it.sku}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <div className="flex items-center bg-slate-100 rounded px-1.5 py-0.5">
                              <span className="text-[10px] text-slate-500 mr-1">
                                Qty:
                              </span>
                              <span className="text-[10px] font-bold text-slate-700">
                                {it.quantity}
                              </span>
                            </div>
                            <div className="flex items-center bg-slate-100 rounded px-1.5 py-0.5">
                              <span className="text-[10px] text-slate-500 mr-1">
                                UOM:
                              </span>
                              <span className="text-[10px] font-bold text-slate-700">
                                {it.uom}
                              </span>
                            </div>
                            <div className="flex items-center bg-slate-100 rounded px-1.5 py-0.5">
                              <span className="text-[10px] text-slate-500 mr-1">
                                W:
                              </span>
                              <span className="text-[10px] font-bold text-slate-700">
                                {it.week}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
                    onClick={() => handleAdjust(row.original.id, row.original.status)}
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
