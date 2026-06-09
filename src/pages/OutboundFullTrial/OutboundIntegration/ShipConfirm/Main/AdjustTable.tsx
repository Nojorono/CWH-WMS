import { useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaBoxes,
  FaHourglassHalf,
} from "react-icons/fa";
import { ColumnDef } from "@tanstack/react-table";
import StatusBadge from "../../../../../common/statusBadge";
import { STATUS_MAP_INTEGRATION_OUTBOUND } from "../../../../../constants/statusMaps";
import { useStoreShipConfirm } from "../../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../../components/ui/activityIndicator";
import ExpandableTableComponent from "../component/Table";
import { formatDateTimeIndo } from "../../../../../helper/FormatDateTime";
import { mapShipConfirmList } from "../../../PickingTransaction/Helper/mapShipConfirmList";
import { OutboundDoUI } from "../../../../../DynamicAPI/types/ShipConfirmType";
import { ShipConfirmRowDetail } from "../component/ShipConfirmRowDetail";

const OutboundShipConfirmTable = ({
  globalFilter,
  setGlobalFilter,
  filteredIO,
}: any) => {
  const { fetchAll, list, pagination, isLoading } = useStoreShipConfirm();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    if (!list || list.length === 0) return [];

    const mappedUI = mapShipConfirmList(list);
    if (!mappedUI || mappedUI.length === 0) return [];

    let result = [...mappedUI];

    // Filter berdasarkan Organization ID
    if (filteredIO) {
      result = result.filter(
        (doItem: OutboundDoUI) => doItem.organization_id === filteredIO,
      );
    }

    // Global Search Filter
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter((doItem: OutboundDoUI) => {
        const matchDO = doItem.outbound_do_number
          ?.toLowerCase()
          .includes(lowerFilter);
        const matchMemo = doItem.outbound_memos?.some((memo) =>
          memo.outbound_memo_number?.toLowerCase().includes(lowerFilter),
        );
        const matchIntegration = doItem.outbound_memos?.some((memo) =>
          memo.outbound_memo_items?.some((item) => {
            const intg = item.integration_data;
            return (
              intg?.iso_header_id?.toLowerCase().includes(lowerFilter) ||
              intg?.transaction_type?.toLowerCase().includes(lowerFilter) ||
              intg?.delivery_name?.toLowerCase().includes(lowerFilter)
            );
          }),
        );
        return matchDO || matchMemo || matchIntegration;
      });
    }

    return result;
  }, [list, filteredIO, globalFilter]);

  // --- COLUMNS DEFINITION ---
  const columns: ColumnDef<OutboundDoUI>[] = useMemo(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <button className="p-1 rounded-full bg-slate-100 group-hover:bg-white transition-colors">
              {row.getIsExpanded() ? (
                <FaChevronDown className="text-blue-600 w-3 h-3" />
              ) : (
                <FaChevronRight className="text-slate-400 w-3 h-3" />
              )}
            </button>
          </div>
        ),
      },
      {
        header: "DO & Memo",
        accessorKey: "outbound_do_number",
        cell: ({ row }) => {
          const doData = row.original;
          const firstMemo = doData.outbound_memos?.[0];
          const memoCount = doData.outbound_memos?.length || 0;

          return (
            <>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                  DO Number
                </span>
                <span className="font-bold text-blue-700 font-mono tracking-tight text-sm">
                  {doData.outbound_do_number || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 rounded font-mono">
                  Memo: {firstMemo?.outbound_memo_number || "-"}
                  {memoCount > 1 && ` (+${memoCount - 1} more)`}
                </span>
              </div>
            </>
          );
        },
      },
      {
        header: "Transaction Type",
        id: "transaction_type",
        cell: ({ row }) => {
          const integration =
            row.original.outbound_memos?.[0]?.outbound_memo_items?.[0]
              ?.integration_data;
          return (
            <div className="flex flex-col">
              <span className="text-[11px] leading-tight text-orange-600 font-bold">
                {integration?.transaction_type || "-"}
              </span>
              <span className="text-[10px] text-slate-500 italic">
                Source: {integration?.source_system || "WMS"}
              </span>
            </div>
          );
        },
      },
      {
        header: "Ship Status",
        id: "ship_confirm_status",
        cell: ({ row }) => {
          const doData = row.original;

          // 🔹 1. LOGIKAL INTERACTIVE KHUSUS UNTUK TIPE SUBDIST
          if (doData.outbound_type === "SUBDIST") {
            const allItems =
              doData.outbound_memos?.flatMap(
                (memo) => memo.outbound_memo_items || [],
              ) || [];

            if (allItems.length > 0) {
              // Tahap Final: Apakah sudah sukses Ship Confirm?
              const isShipConfirmSuccess = allItems.every(
                (item) => item.integration_data?.ship_confirm_status === "S",
              );

              if (isShipConfirmSuccess) {
                return (
                  <div className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5 px-3 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 shadow-sm">
                      <FaCheckCircle className="text-[10px] text-emerald-500" />
                      <span className="text-[10px] font-black tracking-wide uppercase font-sans">
                        Ship Confirmed
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono tracking-tight bg-slate-100 px-1.5 rounded">
                      REQ ID:{" "}
                      {allItems[0]?.integration_data?.ship_confirm_request_id ||
                        "N/A"}
                    </span>
                  </div>
                );
              }

              // Tahap Pertama: Cek 3 pilar wajib (Create, Update, Pick = S)
              const isPickReleaseSuccess = allItems.every((item) => {
                const intg = item.integration_data;
                return (
                  intg?.create_delivery_status === "S" &&
                  intg?.update_delivery_status === "S" &&
                  intg?.pick_release_status === "S"
                );
              });

              if (isPickReleaseSuccess) {
                return (
                  <div className="flex flex-col items-start gap-1">
                    {/* FIX: Warna diselaraskan menggunakan tema Indigo lembut */}
                    <div className="flex items-center gap-1.5 px-3 py-0.5 bg-indigo-50 border border-indigo-200 rounded-full text-indigo-700 shadow-sm">
                      <FaBoxes className="text-[10px] text-indigo-500" />
                      <span className="text-[10px] font-black tracking-wide uppercase font-sans">
                        Pick Release Success
                      </span>
                    </div>
                    {/* FIX: Teks dipersingkat jadi REQ ID agar seragam dan tidak merusak lebar kolom */}
                    <span className="text-[9px] text-slate-400 font-mono tracking-tight bg-slate-100 px-1.5 rounded">
                      REQ ID:{" "}
                      {allItems[0]?.integration_data?.pick_release_request_id ||
                        "N/A"}
                    </span>
                  </div>
                );
              }
            }
          }

          // 🔹 2. FALLBACK UNTUK TIPE NON-SUBDIST / JIKA KONDISI DI ATAS BELUM PENUH
          const fallbackIntegration =
            doData.outbound_memos?.[0]?.outbound_memo_items?.[0]
              ?.integration_data;
          const rawStatus = fallbackIntegration?.ship_confirm_status || "U";

          const statusConfig: Record<
            string,
            {
              bg: string;
              text: string;
              border: string;
              label: string;
            }
          > = {
            S: {
              bg: "bg-emerald-500",
              text: "text-white",
              border: "border-emerald-500",
              label: "S",
            },
            E: {
              bg: "bg-rose-500",
              text: "text-white",
              border: "border-rose-500",
              label: "E",
            },
            U: {
              bg: "bg-slate-50",
              text: "text-slate-600",
              border: "border-slate-200",
              label: "U",
            },
          };

          const currentConfig = statusConfig[rawStatus] || statusConfig["U"];

          return (
            <div className="flex flex-col items-start gap-1">
              <div
                className={`flex items-center gap-1.5 px-3 py-0.5 ${currentConfig.bg} ${currentConfig.border} border rounded-full ${currentConfig.text} shadow-sm`}
              >
                <span className="text-[13px] font-black tracking-wide uppercase font-sans">
                  {currentConfig.label}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono tracking-tight bg-slate-100 px-1.5 rounded">
                REQ ID: {fallbackIntegration?.ship_confirm_request_id || "N/A"}
              </span>
            </div>
          );
        },
      },
      {
        header: "Expedition Info",
        accessorKey: "expedition",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-700 font-bold truncate max-w-[150px]">
              {row.original.expedition || "-"}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-500">
              <FaTruck size={10} />
              <span>{row.original.license_plate || "-"}</span>
            </div>
          </div>
        ),
      },
      {
        header: "Integration Date",
        accessorKey: "createdAt",
        cell: ({ row }) => {
          const integration =
            row.original.outbound_memos?.[0]?.outbound_memo_items?.[0]
              ?.integration_data;
          return (
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-700 font-semibold">
                {formatDateTimeIndo(row.original.createdAt)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ISO: {integration?.iso_header_id || "-"}
              </span>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="relative bg-[#f1f5f9] p-4 min-h-screen">
      {isLoading && <ActIndicator />}

      {filteredIO && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between shadow-sm">
          <span className="text-xs text-blue-700 font-semibold uppercase tracking-wider">
            📍 Showing results for Org ID: {filteredIO}
          </span>
          <span className="text-[10px] bg-blue-600 text-white px-2.5 py-1 rounded-full font-bold shadow-md shadow-blue-200">
            {filteredData.length} DO Matches
          </span>
        </div>
      )}

      <ExpandableTableComponent
        data={filteredData}
        columns={columns}
        renderRowDetails={(row) => (
          <ShipConfirmRowDetail doData={row.original} />
        )}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination?.totalPages || 0}
        onPageChange={(page: number, size: number) => {
          setPageIndex(page);
          setPageSize(size);
        }}
      />
    </div>
  );
};

export default OutboundShipConfirmTable;
