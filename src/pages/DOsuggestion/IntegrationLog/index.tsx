import { useState, useMemo, useRef, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useMoveOrderIntegration } from "./hook/useMoveOrderIntegration";
import { MoveOrderIntegrationHeader } from "../../../API/types/DOsuggestionIntegration";
import { DataTable } from "./component/Table";
import {
  FaFilter,
  FaExclamationCircle,
  FaCheckCircle,
  FaBox,
  FaClock,
  FaSyncAlt,
} from "react-icons/fa";
import { formatDateTimeIndo } from "../../../helper/FormatDateTime";

// Komponen Badge dengan Pesan Informatif
const StatusBadge = ({
  status,
  message,
}: {
  status: string;
  message: string;
}) => {
  const isIntegrated = status === "INTEGRATED" || status === "SUCCESS";
  const isError = status === "ERROR" || status === "TIMEOUT";

  const colorStyles = isIntegrated
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isError
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${colorStyles}`}
      >
        {isIntegrated ? (
          <FaCheckCircle size={12} />
        ) : (
          <FaExclamationCircle size={12} />
        )}
        {status}
      </span>
      <p
        className="text-[10px] text-slate-500 max-w-[220px] truncate leading-tight"
        title={message}
      >
        {message || "Tidak ada detail tambahan"}
      </p>
    </div>
  );
};

const IntegrationMonitoringPage = () => {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<
    "INTEGRATED" | "ERROR" | "TIMEOUT" | ""
  >("");

  const {
    data: response,
    isLoading,
    refetch,
  } = useMoveOrderIntegration({
    page,
    limit,
    sortOrder: "DESC",
    iface_status: statusFilter || undefined,
    source_system: "WMS",
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRefresh = useCallback(() => {
    if (isRefreshing || isLoading) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    setIsRefreshing(true);
    debounceRef.current = setTimeout(async () => {
      try {
        await refetch();
      } finally {
        setTimeout(() => setIsRefreshing(false), 600);
      }
    }, 300);
  }, [isRefreshing, isLoading, refetch]);

  const refreshBusy = isRefreshing || isLoading;

  const columns = useMemo<ColumnDef<MoveOrderIntegrationHeader>[]>(
    () => [
      {
        accessorKey: "request_number",
        header: "Request Info",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">
              {row.original.request_number}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {row.original.operation} • {row.original.source_system}
            </span>
          </div>
        ),
      },
      { accessorKey: "description", header: "PIC / Deskripsi" },
      {
        accessorKey: "creation_date",
        header: "Waktu Proses",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-slate-600">
            <FaClock size={12} className="text-slate-400" />
            {formatDateTimeIndo(row.original.creation_date)}
          </div>
        ),
      },
      {
        accessorKey: "iface_status",
        header: "Status Integrasi",
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.iface_status}
            message={row.original.iface_message}
          />
        ),
      },
    ],
    [],
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Monitoring Integrasi
            </h1>
            <p className="text-sm text-slate-500">
              Pusat kontrol dan pantauan sinkronisasi data.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Tombol Refresh */}
            <button
              onClick={handleRefresh}
              disabled={refreshBusy}
              className={`flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all duration-200 ${refreshBusy ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <FaSyncAlt
                className={`transition-transform duration-500 ${refreshBusy ? "animate-spin" : ""}`}
                size={14}
              />
              {refreshBusy ? "Memuat..." : "Refresh"}
            </button>

            {/* Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
              <FaFilter className="text-slate-400" size={14} />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setPage(1);
                }}
                className="text-sm border-none bg-transparent focus:ring-0 cursor-pointer font-medium text-slate-700"
              >
                <option value="">Semua Status</option>
                <option value="INTEGRATED">Berhasil</option>
                <option value="ERROR">Gagal</option>
                <option value="TIMEOUT">Timeout</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={response?.data || []}
          isLoading={isLoading}
          pageIndex={page}
          pageSize={limit}
          totalPages={response?.meta.totalPages || 0}
          onPageChange={setPage}
          onPageSizeChange={(l: number) => {
            setLimit(l);
            setPage(1);
          }}
          renderSubComponent={({ row }: any) => {
            const data = row.original as MoveOrderIntegrationHeader;
            return (
              <div className="p-6 bg-slate-50/50 border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-700 mb-4 font-bold text-sm">
                  <FaBox className="text-indigo-500" /> Detail Item Lines (
                  {data.lines.length} items)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.lines.map((line: any) => (
                    <div
                      key={line.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          ITEM ID: {line.inventory_item_id}
                        </span>
                        <span className="text-xs font-bold text-indigo-600">
                          {line.quantity} {line.uom_code}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400">
                          Subinventory:{" "}
                          <span className="text-slate-700 font-medium">
                            {line.from_subinventory_code} ➝{" "}
                            {line.to_subinventory_code}
                          </span>
                        </p>
                        <div
                          className={`text-[10px] font-semibold mt-2 pt-2 border-t ${line.iface_status === "SUCCESS" ? "text-emerald-600" : "text-red-600"}`}
                        >
                          {line.iface_status}{" "}
                          {line.iface_message && `- ${line.iface_message}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default IntegrationMonitoringPage;
