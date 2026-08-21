import React, { useCallback, useEffect, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { showErrorToast } from "../../../../components/toast";
import { getBTBPagination } from "../services/BTBservice";
import { BTB, BTBMeta, BTBStatus } from "../services/types";

const STATUS_OPTIONS: { value: BTBStatus; label: string }[] = [
  { value: "DRAFT", label: "UNAPPLIED" },
  { value: "APPLIED", label: "APPLIED" },
];
const LIMIT_OPTIONS = [10, 20, 50, 100];

const todayYmd = () => new Date().toISOString().slice(0, 10);

const formatStatusLabel = (status?: string) => {
  const value = (status || "").toUpperCase();
  if (value === "DRAFT") return "UNAPPLIED";
  return value || "-";
};

const statusBadgeClass = (status?: string) => {
  const value = (status || "").toUpperCase();
  if (value === "DRAFT") return "bg-slate-100 text-slate-700";
  if (value === "APPLIED") return "bg-blue-50 text-blue-700";
  return "bg-orange-50 text-orange-700";
};

const ListBTB = () => {
  const [status, setStatus] = useState<BTBStatus>("DRAFT");
  const [dateFrom, setDateFrom] = useState(todayYmd);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [rows, setRows] = useState<BTB[]>([]);
  const [meta, setMeta] = useState<BTBMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const dateInputRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  useEffect(() => {
    if (!dateInputRef.current) return;

    const fp = flatpickr(dateInputRef.current, {
      enableTime: false,
      dateFormat: "Y-m-d",
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      defaultDate: dateFrom || undefined,
      onChange: (_dates, dateStr) => {
        setDateFrom(dateStr || "");
        setPage(1);
      },
    });

    flatpickrRef.current = fp;

    return () => {
      fp.destroy();
      flatpickrRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchList = useCallback(async () => {
    if (!dateFrom.trim()) {
      showErrorToast("Harap pilih Date From");
      return;
    }

    setIsLoading(true);
    try {
      const result = await getBTBPagination({
        page,
        limit,
        status,
        date_from: dateFrom.trim(),
        date_to: dateFrom.trim(),
        sortOrder: "DESC",
      });

      if (!result.success) {
        setRows([]);
        setMeta(null);
        showErrorToast(result.message);
        return;
      }

      setRows(result.data.data);
      setMeta(result.data.meta);
    } catch (error: unknown) {
      setRows([]);
      setMeta(null);
      const message =
        error instanceof Error ? error.message : "Gagal mengambil data BTB";
      showErrorToast(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, status, dateFrom]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const rowKey = (row: BTB, index: number) =>
    row.btb_number || `${row.sales_nik}-${row.btb_date}-${index}`;

  const getDetails = (row: BTB) => row.details ?? row.btb_details ?? [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Status *
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as BTBStatus);
              setPage(1);
            }}
            className="w-full text-sm px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Date *
          </label>
          <input
            ref={dateInputRef}
            type="text"
            readOnly
            defaultValue={dateFrom}
            placeholder="YYYY-MM-DD"
            className="w-full cursor-pointer text-sm px-3 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            onFocus={() => flatpickrRef.current?.open()}
          />
        </div>

        <div className="flex sm:justify-end">
          <button
            type="button"
            onClick={fetchList}
            disabled={isLoading}
            className="w-full sm:w-auto bg-[#F97316] hover:bg-orange-600 text-white font-semibold py-2.5 px-6 rounded-lg disabled:opacity-60"
          >
            {isLoading ? "Memuat..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold w-10" />
                <th className="px-4 py-3 font-semibold">No</th>
                <th className="px-4 py-3 font-semibold">BTB Number</th>
                <th className="px-4 py-3 font-semibold">Tanggal</th>
                <th className="px-4 py-3 font-semibold">Org</th>
                <th className="px-4 py-3 font-semibold">Sales</th>
                <th className="px-4 py-3 font-semibold">SPV</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    Memuat data BTB...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-400 italic"
                  >
                    Tidak ada data BTB untuk status {formatStatusLabel(status)}
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => {
                  const key = rowKey(row, index);
                  const details = getDetails(row);
                  const expanded = Boolean(expandedRows[key]);
                  const rowNumber = (page - 1) * limit + index + 1;

                  return (
                    <React.Fragment key={key}>
                      <tr className="border-b border-slate-100 hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleRow(key)}
                            className="text-slate-400 hover:text-orange-500"
                            title={expanded ? "Tutup detail" : "Lihat detail"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-4 w-4 transition-transform ${
                                expanded ? "rotate-90" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-400">{rowNumber}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {row.btb_number || "-"}
                        </td>
                        <td className="px-4 py-3">{row.btb_date || "-"}</td>
                        <td className="px-4 py-3">
                          {row.organization_code || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold uppercase">
                            {row.sales_name || "-"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {row.sales_nik || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold uppercase">
                            {row.sales_spv_name || "-"}
                          </div>
                          <div className="text-xs text-slate-400">
                            {row.sales_spv_nik || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeClass(
                              row.status,
                            )}`}
                          >
                            {formatStatusLabel(row.status || status)}
                          </span>
                        </td>
                      </tr>

                      {expanded && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={8} className="px-4 py-4">
                            {details.length === 0 ? (
                              <p className="text-sm text-slate-400 italic px-2">
                                Tidak ada detail item
                              </p>
                            ) : (
                              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                <table className="w-full text-sm">
                                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                    <tr>
                                      <th className="px-3 py-2 font-semibold w-12">
                                        No
                                      </th>
                                      <th className="px-3 py-2 font-semibold">
                                        Item Name
                                      </th>
                                      <th className="px-3 py-2 font-semibold">
                                        SKU
                                      </th>
                                      <th className="px-3 py-2 font-semibold text-right">
                                        Qty
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {details.map((item, itemIdx) => (
                                      <tr
                                        key={`${item.item_code}-${item.inventory_item_id}-${itemIdx}`}
                                        className="border-b border-slate-100 last:border-0"
                                      >
                                        <td className="px-3 py-2 text-slate-400">
                                          {itemIdx + 1}
                                        </td>
                                        <td className="px-3 py-2 font-semibold">
                                          {item.item_name}
                                        </td>
                                        <td className="px-3 py-2 text-slate-500">
                                          {item.item_code}
                                        </td>
                                        <td className="px-3 py-2 text-right font-bold text-[#F97316]">
                                          {item.btb_qty} {item.btb_uom}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Halaman {meta?.page ?? page} dari {meta?.totalPages || 1} (
              {meta?.total ?? 0} data)
            </span>
            <label className="inline-flex items-center gap-2">
              <span className="text-slate-500">Rows per page</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                disabled={isLoading}
                className="text-sm px-2 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-50"
              >
                {LIMIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!meta?.hasPreviousPage || isLoading || page <= 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!meta?.hasNextPage || isLoading}
              onClick={() => setPage((prev) => prev + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListBTB;
