import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaChevronDown,
  FaChevronRight,
  FaDatabase,
  FaBoxOpen,
  FaInfoCircle,
  FaCalendarAlt,
  FaRoute,
  FaFingerprint,
  FaSync,
} from "react-icons/fa";
import { ColumnDef, ExpandedState } from "@tanstack/react-table";
import StatusBadge from "../../../../../common/statusBadge";
import { STATUS_MAP_INTEGRATION_OUTBOUND } from "../../../../../constants/statusMaps";
import { useStoreIRIntegration } from "../../../../../DynamicAPI/stores/Store/MasterStore";
import ActIndicator from "../../../../../components/ui/activityIndicator";
import ExpandableTableComponent from "../component/Table";
import { formatDateTimeIndo } from "../../../../../helper/FormatDateTime";
import Button from "../../../../../components/ui/button/Button";
import axiosInstance from "../../../../../DynamicAPI/AxiosInstance";
import { showErrorToast } from "../../../../../components/toast";

type PollMemoResult = {
  outbound_memo_id?: string | null;
  status?: string | null;
  reason?: string | null;
};

type PollResultView = {
  status?: string | null;
  reason?: string | null;
  outbound_do_id?: string | null;
  has_error?: boolean;
  updated_count?: number | null;
  error?: string | null;
  memos?: PollMemoResult[];
  stages?: {
    ir?: string | null;
    io?: string | null;
    oi?: string | null;
    ir_message?: string | null;
    io_message?: string | null;
    oi_message?: string | null;
  };
  items?: Array<{
    ir_number?: string | null;
    so_number?: string | null;
    iface_status_ir?: string | null;
    iface_status_io?: string | null;
    iface_status_oi?: string | null;
    iface_message_ir?: string | null;
    iface_message_io?: string | null;
    iface_message_oi?: string | null;
  }>;
};

const normalizePollPayload = (payload: any): PollResultView => {
  const data =
    payload?.data?.memos || payload?.data?.status
      ? payload.data
      : payload?.data?.data?.memos || payload?.data?.data?.status
        ? payload.data.data
        : (payload?.data ?? payload ?? {});

  const rawMemos = Array.isArray(data?.memos)
    ? data.memos
    : Array.isArray(payload?.memos)
      ? payload.memos
      : Array.isArray(payload?.data?.memos)
        ? payload.data.memos
        : [];

  const memos: PollMemoResult[] = rawMemos.map((memo: any) => ({
    outbound_memo_id:
      memo.outbound_memo_id ?? memo.memo_id ?? memo.id ?? null,
    status: memo.status ?? null,
    reason: memo.reason ?? memo.message ?? null,
  }));

  const rows: any[] = Array.isArray(data.ir_reqs)
    ? data.ir_reqs
    : Array.isArray(data.outbound_integration_ir_reqs)
      ? data.outbound_integration_ir_reqs
      : Array.isArray(data.items)
        ? data.items
        : [];

  return {
    status: data.status ?? data.iface_status_ir ?? null,
    reason:
      data.reason ??
      data.iface_message_ir ??
      data.message ??
      payload?.message ??
      null,
    outbound_do_id: data.outbound_do_id ?? null,
    has_error: Boolean(data.has_error),
    updated_count: data.deliveries_updated ?? data.updated_count ?? null,
    memos,
    stages: {
      ir: data.iface_status_ir ?? null,
      io: data.iface_status_io ?? null,
      oi: data.iface_status_oi ?? null,
      ir_message: data.iface_message_ir ?? null,
      io_message: data.iface_message_io ?? null,
      oi_message: data.iface_message_oi ?? null,
    },
    items: rows.map((item) => ({
      ir_number: item.ir_number,
      so_number: item.so_number,
      iface_status_ir: item.iface_status_ir,
      iface_status_io: item.iface_status_io,
      iface_status_oi: item.iface_status_oi,
      iface_message_ir: item.iface_message_ir,
      iface_message_io: item.iface_message_io,
      iface_message_oi: item.iface_message_oi,
    })),
  };
};

const pollStatusClass = (status?: string | null) => {
  const s = (status || "").toUpperCase();
  if (s === "S" || s === "SUCCESS") return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (s === "E" || s === "ERROR") return "text-red-700 bg-red-50 border-red-200";
  if (s === "U" || s === "PENDING") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-slate-600 bg-slate-50 border-slate-200";
};

const pollStatusLabel = (status?: string | null) => {
  const s = (status || "-").toUpperCase();
  if (s === "S" || s === "SUCCESS") return "SUCCESS";
  if (s === "E" || s === "ERROR") return "ERROR";
  if (s === "U" || s === "PENDING") return "PENDING";
  return s || "-";
};

const normalizeIfaceStatus = (status?: string | null) =>
  String(status || "").trim().toUpperCase();

const isIfaceSuccess = (status?: string | null) => {
  const s = normalizeIfaceStatus(status);
  return s === "S" || s === "SUCCESS";
};

const isIfaceError = (status?: string | null) => {
  const s = normalizeIfaceStatus(status);
  return s === "E" || s === "ERROR" || s === "FAILED";
};

/** IR + IO + OI: all S → S, any E → E, otherwise P */
const getCombinedIfaceStatus = (
  ir?: string | null,
  io?: string | null,
  oi?: string | null,
): "S" | "E" | "P" => {
  const statuses = [ir, io, oi];
  if (statuses.some(isIfaceError)) return "E";
  if (statuses.every(isIfaceSuccess)) return "S";
  return "P";
};

const IRSOTable = ({
  globalFilter,
  setGlobalFilter,
  filteredIO,
}: any) => {
  const { fetchUsingPagination, list, pagination, isLoading } =
    useStoreIRIntegration();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [pollingMap, setPollingMap] = useState<Record<string, boolean>>({});
  const [pollResultMap, setPollResultMap] = useState<
    Record<string, PollResultView>
  >({});
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const refreshList = useCallback(async () => {
    if (!fetchUsingPagination) return;
    await fetchUsingPagination({
      page: pageIndex + 1,
      limit: pageSize,
    });
  }, [fetchUsingPagination, pageIndex, pageSize]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const filteredData = useMemo(() => {
    if (!list) return [];

    let result = [...list];

    // Filter Organization (client-side)
    if (filteredIO) {
      result = result.filter(
        (item: any) => item.organization_id === filteredIO,
      );
    }

    // Search client-side pada data page pagination yang aktif
    if (globalFilter) {
      const lowerFilter = globalFilter.toLowerCase();
      result = result.filter(
        (item: any) =>
          item.ir_number?.toLowerCase().includes(lowerFilter) ||
          item.so_number?.toLowerCase().includes(lowerFilter) ||
          item.transaction_type?.toLowerCase().includes(lowerFilter) ||
          item.batch_number?.toLowerCase().includes(lowerFilter),
      );
    }

    return result;
  }, [list, filteredIO, globalFilter]);

  const handlePollIRSO = async (outboundDoId?: string, rowId?: string) => {
    if (!outboundDoId) {
      showErrorToast("Outbound DO ID tidak ditemukan.");
      return;
    }

    // Auto-expand baris agar hasil poll langsung terlihat
    if (rowId) {
      setExpanded((prev) => {
        const current = typeof prev === "object" && prev !== null ? prev : {};
        return { ...current, [rowId]: true };
      });
    }

    setPollingMap((prev) => ({ ...prev, [outboundDoId]: true }));
    try {
      const response = await axiosInstance.get(
        `outbound-integration-ir-req/poll-status/outbound-do/${outboundDoId}`,
      );
      const result = normalizePollPayload(response?.data);
      setPollResultMap((prev) => ({ ...prev, [outboundDoId]: result }));
      await refreshList();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Gagal poll status IR/SO.";
      showErrorToast(msg);
      setPollResultMap((prev) => ({
        ...prev,
        [outboundDoId]: {
          status: "ERROR",
          has_error: true,
          error: msg,
          reason: msg,
        },
      }));
    } finally {
      setPollingMap((prev) => ({ ...prev, [outboundDoId]: false }));
    }
  };

  const columns: ColumnDef<any>[] = useMemo(
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
        header: "Document Info",
        accessorKey: "ir_number",
        cell: ({ row }) => (
          <>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                IR Number
              </span>
              <span className="font-bold text-blue-700 font-mono tracking-tight text-sm">
                {row.original.ir_number || "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 rounded font-mono">
                SO: {row.original.so_number || "-"}
              </span>
            </div>
          </>
        ),
      },
      {
        header: "Transaction & Routing",
        accessorKey: "transaction_type",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-[12px] leading-tight text-orange-600 font-bold truncate max-w-[200px]">
              {row.original.transaction_type}
            </span>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
              <span
                className="truncate max-w-[80px]"
                title={row.original.io_source_name}
              >
                {row.original.io_source_name}
              </span>
              <FaChevronRight className="text-slate-300 w-2 h-2 flex-shrink-0" />
              <span
                className="truncate max-w-[80px]"
                title={row.original.io_dest_name}
              >
                {row.original.io_dest_name}
              </span>
            </div>
          </div>
        ),
      },
      {
        header: "Total Lines",
        accessorKey: "total_lines",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[11px] font-extrabold uppercase">
              {row.original.total_lines} Items
            </span>
          </div>
        ),
      },
      {
        header: "IR Sync Status",
        accessorKey: "iface_status_ir",
        cell: ({ row }) => {

          const combinedStatus = getCombinedIfaceStatus(
            row.original.iface_status_ir,
            row.original.iface_status_io,
            row.original.iface_status_oi,
          ); 
          return (
            <StatusBadge
              status={combinedStatus}
              colorMap={STATUS_MAP_INTEGRATION_OUTBOUND || {}}
              variant="solid"
              size="sm"
            />
          );
        },
      },
      {
        header: "Created Date",
        accessorKey: "createdAt",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-700 font-semibold">
              {formatDateTimeIndo(row.original.createdAt)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Batch: {row.original.batch_number}
            </span>
          </div>
        ),
      },
      {
        header: "Updated Date",
        accessorKey: "updatedAt",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-700 font-semibold">
              {formatDateTimeIndo(row.original.updatedAt)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
              Batch: {row.original.batch_number}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const outboundDoId = row.original?.outbound_do_id as string | undefined;
          const isPolling = outboundDoId ? pollingMap[outboundDoId] : false;
          const irStatus = String(row.original.iface_status_ir || "").toUpperCase();
          const isIrSuccess = irStatus === "S" || irStatus === "SUCCESS";
          const hasSoNumber = Boolean(
            String(row.original.so_number || "").trim(),
          );
          const isPollLocked = isIrSuccess && hasSoNumber;

          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                type="button"
                variant="action"
                size="xsm"
                onClick={() => handlePollIRSO(outboundDoId, row.id)}
                disabled={Boolean(isPolling) || !outboundDoId || isPollLocked}
                startIcon={
                  <FaSync className={isPolling ? "animate-spin" : ""} />
                }
                title={
                  !outboundDoId
                    ? "Outbound DO ID tidak tersedia"
                    : isPollLocked
                      ? "IR sudah SUCCESS dan SO number tersedia"
                      : isIrSuccess && !hasSoNumber
                        ? "IR SUCCESS tetapi SO number belum ada — poll masih diperlukan"
                        : "Poll status IR/SO"
                }
              >
                {isPollLocked
                  ? "Done"
                  : isPolling
                    ? "Polling..."
                    : "Poll IR/SO"}
              </Button>
            </div>
          );
        },
      },
    ],
    [pollingMap],
  );

  const renderRowDetails = (row: any) => {
    const data = row.original;
    const pollResult = data.outbound_do_id
      ? pollResultMap[data.outbound_do_id]
      : undefined;

    return (
      <div className="p-6 bg-[#f8fafc] border-x-4 border-l-blue-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Hasil poll IR/SO */}
          <div className="md:col-span-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3 border-b pb-2">
              <h4 className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-widest">
                <FaSync /> Hasil Poll IR/SO
              </h4>
              {pollResult?.status && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${pollStatusClass(pollResult.status)}`}
                >
                  {pollStatusLabel(pollResult.status)}
                </span>
              )}
            </div>

            {!pollResult ? (
              <p className="text-[12px] text-slate-400 italic">
                Belum ada hasil poll. Klik tombol <b>Poll IR/SO</b> untuk melihat
                status dan detail per memo.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Status
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${pollStatusClass(pollResult.status)}`}
                      >
                        {pollStatusLabel(pollResult.status)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Outbound DO ID
                    </span>
                    <p
                      className="mt-1 font-mono text-[11px] text-slate-700 break-all"
                      title={pollResult.outbound_do_id || data.outbound_do_id}
                    >
                      {pollResult.outbound_do_id || data.outbound_do_id || "-"}
                    </p>
                  </div>
                </div>

                {pollResult.reason && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2">
                    <span className="text-[10px] uppercase tracking-wider text-amber-600 font-semibold">
                      Reason
                    </span>
                    <p className="mt-1 text-[12px] text-slate-700">
                      {pollResult.reason}
                    </p>
                  </div>
                )}

                {pollResult.error && (
                  <p className="text-[12px] text-red-600 font-medium">
                    {pollResult.error}
                  </p>
                )}

                {(pollResult.memos?.length ?? 0) > 0 ? (
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3">
                    <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-bold mb-2 block">
                      Memos ({pollResult.memos!.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pollResult.memos!.map((memo, index) => (
                        <div
                          key={`${memo.outbound_memo_id || "memo"}-${index}`}
                          className="rounded-lg border border-indigo-100 bg-white p-3 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Memo #{index + 1}
                            </span>
                            <span
                              className={`shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded border ${pollStatusClass(memo.status)}`}
                            >
                              {pollStatusLabel(memo.status)}
                            </span>
                          </div>

                          <div className="space-y-2 text-[11px]">
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                                outbound_memo_id
                              </span>
                              <p
                                className="font-mono text-slate-800 break-all"
                                title={memo.outbound_memo_id || undefined}
                              >
                                {memo.outbound_memo_id || "-"}
                              </p>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                                status
                              </span>
                              <p className="font-semibold text-slate-700">
                                {pollStatusLabel(memo.status)}
                              </p>
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                                reason
                              </span>
                              <p className="text-slate-600 leading-snug">
                                {memo.reason || "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-slate-400 italic">
                      Tidak ada data <b>memos</b> pada hasil poll.
                    </p>
                  </div>
                )}

                {(pollResult.items?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pollResult.items!.map((item, index) => (
                      <div
                        key={`${item.ir_number || "ir"}-${index}`}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="text-[11px] font-bold text-slate-700 mb-2">
                          #{index + 1} — IR: {item.ir_number || "-"} | SO:{" "}
                          {item.so_number || "-"}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <MiniStatus
                            label="IR"
                            status={item.iface_status_ir || "-"}
                          />
                          <MiniStatus
                            label="IO"
                            status={item.iface_status_io || "-"}
                          />
                          <MiniStatus
                            label="OI"
                            status={item.iface_status_oi || "-"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!pollResult.memos?.length &&
                  !pollResult.items?.length &&
                  (pollResult.stages?.ir ||
                    pollResult.stages?.io ||
                    pollResult.stages?.oi) && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="flex flex-wrap gap-2">
                        <MiniStatus
                          label="IR"
                          status={pollResult.stages?.ir || "-"}
                        />
                        <MiniStatus
                          label="IO"
                          status={pollResult.stages?.io || "-"}
                        />
                        <MiniStatus
                          label="OI"
                          status={pollResult.stages?.oi || "-"}
                        />
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Card 1: Technical & System IDs */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-slate-100 group-hover:text-blue-50 transition-colors">
              <FaFingerprint size={40} />
            </div>
            <h4 className="flex items-center gap-2 text-blue-700 font-bold text-xs mb-4 uppercase tracking-widest border-b pb-2">
              <FaDatabase /> System Identifiers
            </h4>
            <div className="space-y-3">
              <InfoItem
                label="Data ID"
                value={data.id}
                mono
                color="text-slate-800"
              />
              <InfoItem
                label="Outbound DO ID"
                value={data.outbound_do_id}
                mono
              />
              <InfoItem
                label="Iface Header ID"
                value={data.iface_header_id}
                mono
                color="text-blue-600 font-bold"
              />
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50">
                <InfoItem label="Req IR" value={data.request_id_ir} mono />
                <InfoItem label="Req IO" value={data.request_id_io} mono />
                <InfoItem label="Req OI" value={data.request_id_oi} mono />
              </div>
            </div>
          </div>

          {/* Card 2: Routing & Participants */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-slate-100 group-hover:text-orange-50 transition-colors">
              <FaRoute size={40} />
            </div>
            <h4 className="flex items-center gap-2 text-orange-600 font-bold text-xs mb-4 uppercase tracking-widest border-b pb-2">
              <FaInfoCircle /> Routing Details
            </h4>
            <div className="space-y-3">
              <InfoItem
                label="Source (IO)"
                value={`${data.io_source_name} (ID: ${data.io_source_id})`}
                color="text-orange-700 font-bold"
              />
              <InfoItem
                label="Destination (IO)"
                value={`${data.io_dest_name} (ID: ${data.io_dest_id})`}
                color="text-emerald-700 font-bold"
              />
              <InfoItem
                label="Preparer"
                value={`${data.preparer_number} (ID: ${data.preparer_id})`}
              />
              <InfoItem
                label="Requestor"
                value={`${data.requestor_number} (ID: ${data.requestor_id})`}
              />
            </div>
          </div>

          {/* Card 3: Timeline & Status Detailed */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-slate-100 group-hover:text-emerald-50 transition-colors">
              <FaCalendarAlt size={40} />
            </div>
            <h4 className="flex items-center gap-2 text-emerald-600 font-bold text-xs mb-4 uppercase tracking-widest border-b pb-2">
              <FaCalendarAlt /> History & Sync
            </h4>
            <div className="space-y-3">
              <InfoItem
                label="Need By Date"
                value={formatDateTimeIndo(data.need_by_date)}
                color="text-emerald-700 font-medium"
              />
              <InfoItem
                label="Process Date"
                value={formatDateTimeIndo(data.last_updated_date)}
              />

              {/* Detailed Sync Statuses */}
              <div className="pt-2 mt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase tracking-tighter mb-1.5 block">
                  Interface Statuses
                </span>
                <div className="flex gap-2">
                  <MiniStatus label="IR" status={data.iface_status_ir} />
                  <MiniStatus label="IO" status={data.iface_status_io} />
                  <MiniStatus label="OI" status={data.iface_status_oi} />
                </div>
              </div>
            </div>
          </div>

          {/* Full Width Section: Outbound Lines */}
          <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
              <h4 className="flex items-center gap-2 text-white font-bold text-[11px] uppercase tracking-widest">
                <FaBoxOpen /> Outbound Line Details
              </h4>
              <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {data.lines?.length || 0} Items
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-slate-50 text-slate-500 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-tighter">
                      Line Ref (IR/SO)
                    </th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-tighter">
                      Item Code
                    </th>
                    <th className="px-4 py-2 text-center font-bold uppercase tracking-tighter">
                      Quantity
                    </th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-tighter">
                      Source IDs
                    </th>
                    <th className="px-4 py-2 text-left font-bold uppercase tracking-tighter">
                      Sync Status (IR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.lines?.map((line: any) => (
                    <tr
                      key={line.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-700">
                          IR Line: {line.ir_line_number}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          SO Line: {line.so_line_number}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-blue-700">
                          {line.item}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          Inv ID: {line.inventory_item_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-800 text-xs">
                          {line.quantity}
                        </span>
                        <span className="ml-1 text-slate-400 font-medium uppercase">
                          {line.transaction_uom}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] text-slate-600 font-mono">
                          Iface: {line.iface_line_id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Src: {line.source_line_id?.split("-")[0]}...
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${line.iface_line_status_ir === "S" ? "bg-green-500" : "bg-red-500"}`}
                          ></div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {line.iface_line_status_ir === "S"
                              ? "Success"
                              : "Error"}
                          </span>
                        </div>
                        {line.iface_line_message_ir && (
                          <div
                            className="text-[10px] text-red-500 italic mt-1 line-clamp-1"
                            title={line.iface_line_message_ir}
                          >
                            {line.iface_line_message_ir}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Global Warning/Error Banners for Header Interfaces */}
        {((data.iface_message_ir && data.iface_status_ir !== "S") ||
          (data.iface_message_io && data.iface_status_io !== "S") ||
          (data.iface_message_oi && data.iface_status_oi !== "S")) && (
          <div className="mt-5 p-3 bg-red-50 border-l-4 border-red-500 rounded flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-red-500 px-1.5 py-0.5 rounded text-white text-[10px] font-bold">
                INTERFACE ERRORS
              </div>
            </div>
            <div className="text-xs text-red-800 font-medium flex flex-col gap-1">
              {data.iface_message_ir && data.iface_status_ir !== "S" && (
                <span>
                  <strong className="text-red-900">IR:</strong>{" "}
                  {data.iface_message_ir}
                </span>
              )}
              {data.iface_message_io && data.iface_status_io !== "S" && (
                <span>
                  <strong className="text-red-900">IO:</strong>{" "}
                  {data.iface_message_io}
                </span>
              )}
              {data.iface_message_oi && data.iface_status_oi !== "S" && (
                <span>
                  <strong className="text-red-900">OI:</strong>{" "}
                  {data.iface_message_oi}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative bg-[#f1f5f9] p-4 min-h-screen">
      {isLoading && <ActIndicator />}

      {filteredIO && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
          <span className="text-xs text-blue-700 font-semibold uppercase">
            📍 Showing results for Organization ID: {filteredIO}
          </span>
          <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">
            {filteredData.length} Matches Found
          </span>
        </div>
      )}

      <ExpandableTableComponent
        data={filteredData}
        columns={columns}
        renderRowDetails={renderRowDetails}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalPages={pagination?.totalPages || 0}
        expanded={expanded}
        onExpandedChange={setExpanded}
        getRowId={(row) => String(row.id)}
        onPageChange={(page: number, size: number) => {
          setPageIndex(page);
          setPageSize(size);
        }}
      />
    </div>
  );
};

// --- Helper Components ---

const InfoItem = ({
  label,
  value,
  mono = false,
  color = "text-slate-600",
}: any) => (
  <div className="flex flex-col gap-0.5 border-b border-slate-50 pb-1 last:border-0">
    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
      {label}
    </span>
    <span
      className={`text-[12px] truncate ${mono ? "font-mono text-[11px]" : ""} ${color}`}
      title={value}
    >
      {value || "-"}
    </span>
  </div>
);

const MiniStatus = ({ label, status }: { label: string; status: string }) => (
  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
    <span className="text-[9px] font-bold text-slate-500">{label}:</span>
    <span
      className={`text-[10px] font-extrabold ${
        status === "S"
          ? "text-green-600"
          : status === "E"
            ? "text-red-600"
            : status === "P"
              ? "text-amber-600"
              : "text-slate-400"
      }`}
    >
      {status || "-"}
    </span>
  </div>
);

export default IRSOTable;
