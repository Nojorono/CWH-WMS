import { useEffect, useMemo, useState, useRef, memo } from "react";
import { FaPrint, FaTasks } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate, useSearchParams } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { OutboundDo } from "../Helper/doTypes";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { mapPickingTransactions } from "../Helper/mappedList";
import { formatDateIndo } from "../../../../helper/FormatDate";
import Swal from "sweetalert2";
import Button from "../../../../components/ui/button/Button";
import TableComponent from "../../../../components/tables/ActionTable/TableComponent";
import ActIndicator from "../../../../components/ui/activityIndicator";
import axiosInstance from "../../../../DynamicAPI/AxiosInstance";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import { EndPoint } from "../../../../utils/EndPoint";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";

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
  const navigate = useNavigate();
  const user = usePersistAuthStore((state) => state.user);

  const [searchParams, setSearchParams] = useSearchParams();

  const { fetchUsingPagination, list, pagination, updateData, isLoading } =
    useStoreOutboundDeliveryOrder();

  // 🔹 State untuk Seal Number
  const [showSealModal, setShowSealModal] = useState(false);
  const [selectedDO, setSelectedDO] = useState<OutboundDo | null>(null);
  const [sealInput, setSealInput] = useState("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const pageIndex = currentPage - 1;
  const [pageSize, setPageSize] = useState(10);

  const isInitialMount = useRef(true);
  const prevFiltersRef = useRef({
    globalFilter,
    filteredStatus,
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
      prevFiltersRef.current.globalFilter !== globalFilter ||
      prevFiltersRef.current.filteredStatus !== filteredStatus;

    if (hasFilterChanged) {
      prevFiltersRef.current = {
        globalFilter,
        filteredStatus,
      };

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
      // transaction_picking_status: "COMPLETED"
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
      seal_number: item.seal_number,
      no: pageIndex * pageSize + (index + 1),
    }));
  }, [list, pageIndex, pageSize]);

  // 🔹 Logika Simpan Seal & Navigasi
  const handleConfirmSeal = async () => {
    if (!selectedDO || !sealInput) return;

    try {
      const res = await updateData(selectedDO.id, {
        seal_number: sealInput,
      });

      // Pastikan pengecekan sukses sesuai dengan struktur respons API Anda
      if (res) {
        setShowSealModal(false);

        // Navigasi ke halaman print setelah sukses update
        navigate("/outbound_do/print_surat_jalan", {
          state: { params: selectedDO.id },
        });

        // Opsional: Refresh list agar Seal Number muncul di tabel utama
        if (fetchUsingPagination) {
          fetchUsingPagination({
            page: currentPage,
            limit: pageSize,
            search: globalFilter || "",
            status: filteredStatus || "",
          });
        }
      }
    } catch (error) {
      Swal.fire("Error", "Gagal menyimpan Seal Number", "error");
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
      <div className="flex flex-col gap-3 min-w-[450px]">
        {memos
          .filter((memo) => memo.status !== "CANCELLED")
          .map((memo) => {
            const isOpen = openMemoId === memo.id;

            // Mengambil item dari memo_items yang sudah kita petakan di fungsi mapping sebelumnya
            const memoItems = memo.outbound_memo_items || [];

            return (
              <div
                key={memo.id}
                className={`rounded-xl transition-all duration-300 border-2 ${
                  isOpen
                    ? "border-blue-500 shadow-lg"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* --- HEADER MEMO --- */}
                <div
                  onClick={() => setOpenMemoId(isOpen ? null : memo.id)}
                  className={`p-4 cursor-pointer flex items-center justify-between gap-4 ${
                    isOpen ? "bg-blue-50/50" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-800 tracking-tight">
                        {memo.outbound_memo_number}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Total {memoItems.length} Items dalam Memo ini
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-slate-400"
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* --- BODY: DAFTAR ITEM & GATE LOAD INFO --- */}
                {isOpen && (
                  <div className="bg-slate-50/50 p-3 flex flex-col gap-3 border-t border-slate-100">
                    {memoItems.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs italic">
                        Tidak ada item
                      </div>
                    ) : (
                      memoItems.map((item: any) => (
                        <div
                          key={item.id}
                          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                        >
                          {/* Nama Barang / SKU */}
                          <div className="p-3 border-b border-slate-50 bg-white">
                            <div className="flex justify-between items-start">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-blue-600 uppercase tracking-wide">
                                  {item.item?.sku || "N/A"}
                                </span>
                                <span className="text-[11px] font-bold text-slate-700">
                                  {item.item?.description || "-"}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                  Plan Qty Pick
                                </span>
                                <span className="text-sm font-black text-slate-800">
                                  {item.quantity_plan} {item.uom}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detail Gate Load (Picked, Loaded, Unloaded) */}
                          <div className="p-3 bg-slate-50/30">
                            {item.assigned_gate_load &&
                            item.assigned_gate_load.length > 0 ? (
                              item.assigned_gate_load.map(
                                (gate: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col gap-2"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[9px] font-black text-black-400">
                                        Assign Gate ID: {gate.assigned_gate_id}
                                      </span>
                                      <span
                                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                          gate.status === "APPROVED"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-amber-100 text-amber-700"
                                        }`}
                                      >
                                        {gate.status}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      {/* PICKED */}
                                      <div className="bg-white border border-slate-100 p-2 rounded-lg flex flex-col items-center shadow-sm">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                                          Picked Plan
                                        </span>
                                        <span className="text-xs font-black text-blue-600">
                                          {gate.quantity_picked}
                                        </span>
                                      </div>

                                      {/* LOADED */}
                                      <div className="bg-white border border-slate-100 p-2 rounded-lg flex flex-col items-center shadow-sm">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                                          Loaded
                                        </span>
                                        <span className="text-xs font-black text-emerald-600">
                                          {gate.quantity_loaded}
                                        </span>
                                      </div>

                                      {/* UNLOADED */}
                                      <div className="bg-white border border-slate-100 p-2 rounded-lg flex flex-col items-center shadow-sm">
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">
                                          Unloaded
                                        </span>
                                        <span className="text-xs font-black text-red-500">
                                          {gate.quantity_unloaded}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )
                            ) : (
                              <div className="text-[10px] text-slate-400 italic text-center py-2">
                                Data gate load belum tersedia
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  const roleName = user?.role?.name;
  const canActionDO =
    roleName === "SUPERVISOR" ||
    roleName === "MANAGER" ||
    roleName === "superadmin";

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
        cell: ({ row }) => (
          <div className="flex gap-3">
            {canActionDO && (
              <>
                <FaTasks
                  className={`size-5 cursor-pointer text-orange-600 ${row.original.status === "PENDING" ? "opacity-20 cursor-not-allowed" : ""}`}
                  onClick={() =>
                    row.original.status !== "PENDING" &&
                    handleAdjust(row.original)
                  }
                  title="Adjust Picking Transaction"
                />

                <FaPrint
                  className={`size-5 cursor-pointer text-blue-600 ${row.original.status !== "APPROVED_LOAD" ? "opacity-20 cursor-not-allowed" : ""}`}
                  onClick={() => {
                    if (row.original.status === "APPROVED_LOAD") {
                      const currentSeal = row.original.seal_number;

                      // 🔹 LOGIKA BARU: Cek keberadaan Seal Number
                      if (currentSeal && currentSeal.trim() !== "") {
                        // Jika sudah ada, langsung gas print (navigasi)
                        navigate("/outbound_do/print_surat_jalan", {
                          state: { params: row.original.id },
                        });
                      } else {
                        // Jika kosong, buka modal input seal
                        setSelectedDO(row.original);
                        setSealInput("");
                        setShowSealModal(true);
                      }
                    }
                  }}
                  title="Print Surat Jalan"
                />
              </>
            )}
          </div>
        ),
      },
      {
        id: "ship_confirm",
        header: "Ship Confirm",
        cell: ({ row }) =>
          row.original.seal_number && row.original.seal_number.trim() !== "" ? (
            <div className="flex gap-3">
              {canActionDO && (
                <Button
                  onClick={() => handleShipConfirm(row.original)}
                  variant="action"
                  className={`text-sm bg-emerald-600 hover:bg-emerald-700 text-white w-full py-2 rounded-2xl shadow-lg shadow-emerald-100 animate-pulse text-xs font-black tracking-widest uppercase ${
                    row.original.status !== "APPROVED_LOAD"
                      ? "opacity-20 cursor-not-allowed"
                      : ""
                  }`}
                >
                  Confirm
                </Button>
              )}
            </div>
          ) : null,
      },
    ],
    [currentPage, pageSize],
  );

  const handleAdjust = (data: OutboundDo) => {
    navigate("/outbound_do/detach_attach", {
      state: {
        params: data,
        mode: "adjust",
        title: "Adjust Picking Transaction",
      },
    });
  };

  const handleShipConfirm = async (data: OutboundDo) => {
    const DOid = data.id;

    showConfirmDialog(
      async () => {
        try {
          await axiosInstance.post(
            `${EndPoint}outbound-do/ship-confirm-internal/${DOid}`,
          );
        } catch (error: any) {
          showErrorToast(error.response?.data?.message || "Gagal Ship-confirm");
        } finally {
          console.log("finally submit ship-confirm");
        }
      },
      {
        title: "Confirm Submit",
        text: `Apakah anda ingin yakin?`,
        confirmButtonText: "Ya!",
        cancelButtonText: "Tidak",
      },
    );
  };

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

      {/* 🔹 Modal Add Seal Number */}
      {showSealModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Input Seal Number</h3>
              <button
                onClick={() => setShowSealModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">
                Silahkan masukkan nomor seal untuk DO{" "}
                <b>{selectedDO?.outbound_do_number}</b> sebelum mencetak Surat
                Jalan.
              </p>
              <input
                autoFocus
                type="text"
                placeholder="Contoh: SEAL123456"
                className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 outline-none transition-all font-bold text-lg"
                value={sealInput}
                onChange={(e) => setSealInput(e.target.value)}
              />
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowSealModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Batal
                </button>
                <button
                  disabled={!sealInput}
                  onClick={handleConfirmSeal}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 shadow-lg shadow-blue-200 transition active:scale-95"
                >
                  Simpan & Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdjustTableTransactionPicking;
