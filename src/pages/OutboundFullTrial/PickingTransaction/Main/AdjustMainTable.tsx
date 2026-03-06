import { useEffect, useMemo, useState, useRef } from "react";
import { FaPrint, FaTasks } from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import TableComponent from "../Table/TableComponent";
import { useNavigate, useSearchParams } from "react-router-dom";
import StatusBadge from "../../../../common/statusBadge";
import { STATUS_MAP_DO } from "../../../../constants/statusMaps";
import { OutboundDo } from "../Helper/doTypes";
import { useStoreOutboundDeliveryOrder } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { mapPickingTransactions } from "../Helper/mappedList";
import { formatDateIndo } from "../../../../helper/FormatDate";
import Swal from "sweetalert2"; // Pastikan sweetalert2 terinstall
import Button from "../../../../components/ui/button/Button";

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
  const [searchParams, setSearchParams] = useSearchParams();

  const { fetchUsingPagination, list, pagination, updateData } =
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
            <FaTasks
              className={`size-5 cursor-pointer text-orange-600 ${row.original.status === "PENDING" ? "opacity-20 cursor-not-allowed" : ""}`}
              onClick={() =>
                row.original.status !== "PENDING" && handleAdjust(row.original)
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
          </div>
        ),
      },
      {
        id: "ship_confirm",
        header: "Ship Confirm",
        cell: ({ row }) =>
          row.original.seal_number && row.original.seal_number.trim() !== "" ? (
            <div className="flex gap-3">
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
    Swal.fire({
      title: "Confirm Ship",
      text: `Are you sure you want to confirm shipment for DO ${data.outbound_do_number}?`,
      icon: "warning",
    });
  };

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
                <b>{selectedDO?.outbound_do_number}</b> sebelum mencetak.
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
