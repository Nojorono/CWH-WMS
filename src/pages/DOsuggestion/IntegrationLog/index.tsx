import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import { useMoveOrderIntegration } from "./hook/useMoveOrderIntegration";
import { MoveOrderIntegrationHeader } from "../../../API/types/DOsuggestionIntegration";
import { DataTable } from "./component/Table";
import { FaFilter, FaExclamationCircle, FaCheckCircle } from "react-icons/fa";
import { formatDateTimeIndo } from "../../../helper/FormatDateTime";

// Sub-komponen untuk Badge Status
const StatusBadge = ({ status }: { status: string }) => {
  const isError = status === "ERROR" || status === "TIMEOUT";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
        isError
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-200"
      }`}
    >
      {isError ? (
        <FaExclamationCircle size={12} />
      ) : (
        <FaCheckCircle size={12} />
      )}
      {status}
    </span>
  );
};

const IntegrationMonitoringPage = () => {
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [statusFilter, setStatusFilter] = useState<"INTEGRATED" | "ERROR" | "TIMEOUT" | "">(
    "",
  );

  // Pastikan parameter di hook sinkron dengan state
  const { data: response, isLoading } = useMoveOrderIntegration({
    page,
    limit,
    sortOrder: "DESC",
    iface_status: statusFilter || undefined,
    source_system: "WMS",
  });

  const handlePageSizeChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset ke halaman pertama saat limit berubah
  };

  const tableData = response?.data || [];
  const meta = response?.meta || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  const columns = useMemo<ColumnDef<MoveOrderIntegrationHeader>[]>(
    () => [
      {
        accessorKey: "request_number",
        header: "Request Number",
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            {row.original.request_number}
          </span>
        ),
      },
      { accessorKey: "description", header: "Description" },
      {
        accessorKey: "creation_date",
        header: "Timestamp",
        cell: ({ row }) => (
          <span className="text-slate-500">
            {formatDateTimeIndo(row.original.creation_date)}
          </span>
        ),
      },
      {
        accessorKey: "iface_status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.iface_status} />,
      },
    ],
    [],
  );

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-8xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Monitoring Integrasi
            </h1>
            <p className="text-sm text-slate-500">
              Kelola dan pantau aliran data integrasi sistem WMS
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex items-center px-2 text-slate-400">
              <FaFilter size={14} />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
              className="text-sm bg-transparent border-none focus:ring-0 text-slate-700 font-medium cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="INTEGRATED">Integrated</option>
              <option value="ERROR">Error</option>
              <option value="TIMEOUT">Timeout</option>

            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={tableData}
          isLoading={isLoading}
          pageIndex={meta.page}
          pageSize={limit}
          totalPages={meta.totalPages}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          renderSubComponent={({ row }: any) => {
            const data = row.original as MoveOrderIntegrationHeader;
            return (
              <div className="p-4 bg-slate-50/80 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3 px-1">
                  Detail Item Lines ({data.lines.length} items)
                </p>

                {/* Container dengan Scroll */}
                <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {data.lines.map((line: any) => (
                    <div
                      key={line.id}
                      className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400">
                          Inventory Item Id {line.inventory_item_id}
                        </span>
                        <span className="text-sm font-medium text-slate-800">
                          Line Qty {line.quantity}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] ${line.iface_status === "ERROR" ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {line.iface_message || "Success"}
                      </span>
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
