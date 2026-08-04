import React, { useEffect, useMemo, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import {
  FaInfoCircle,
  FaSyncAlt,
  FaChevronDown,
  FaChevronRight,
  FaChevronLeft,
  FaArrowRight,
} from "react-icons/fa";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { Callplan } from "../../Services/types";
import { callplanService } from "../../Services/CallplanService";
import { SPBViewProps } from "../../types/flow";
import dayjs from "dayjs";

const getInitialBypassState = () => {
  const now = dayjs();
  return {
    date: now.add(1, "day").format("YYYY-MM-DD"),
    time: now.format("HH:mm"),
  };
};

export default function SPBview({
  onProceedToCalculation,
  onProceedToPreparation,
}: SPBViewProps) {
  const { user } = usePersistAuthStore.getState();
  const organization_id = user?.userDetail?.organizationId || "";

  const [callplans, setCallplans] = useState<Callplan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showBypass, setShowBypass] = useState(false);
  const [bypassDate, setBypassDate] = useState(() => {
    const saved = localStorage.getItem("OSM_BYPASS_DATETIME");
    if (saved) return saved.split(" ")[0];
    return getInitialBypassState().date;
  });
  const [bypassTime, setBypassTime] = useState(() => {
    const saved = localStorage.getItem("OSM_BYPASS_DATETIME");
    if (saved?.split(" ")[1]) return saved.split(" ")[1];
    return getInitialBypassState().time;
  });
  const [bypassActive, setBypassActive] = useState(
    () => localStorage.getItem("OSM_BYPASS_ACTIVE") === "true",
  );
  const bypassDateTimeRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  const targetCallplanDate = useMemo(() => {
    if (bypassActive && bypassDate) {
      return bypassDate;
    }
    return dayjs().add(1, "day").format("YYYY-MM-DD");
  }, [bypassActive, bypassDate]);

  const displayCurrentTime = useMemo(() => {
    if (bypassActive && bypassDate && bypassTime) {
      return dayjs(`${bypassDate} ${bypassTime}`).format("DD MMM YYYY - HH:mm");
    }
    return dayjs().format("DD MMM YYYY - HH:mm");
  }, [bypassActive, bypassDate, bypassTime]);

  const fetchCallplans = async () => {
    if (!organization_id) return;

    setIsLoading(true);
    try {
      const data = await callplanService.getCallplans({
        dateStart: targetCallplanDate,
        organizationId: organization_id,
        status: statusFilter,
      });

      setCallplans(data);
      setExpandedRows(data[0] ? { [data[0].id]: true } : {});
    } catch (error) {
      console.error("Error fetching callplans:", error);
      setCallplans([]);
      setExpandedRows({});
      alert("Gagal mengambil data callplan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCallplans();
  }, [organization_id, statusFilter, targetCallplanDate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setShowBypass((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!showBypass || !bypassDateTimeRef.current) return;

    const fp = flatpickr(bypassDateTimeRef.current, {
      enableTime: true,
      enableSeconds: false,
      time_24hr: true,
      dateFormat: "Y-m-d H:i",
      defaultDate: `${bypassDate} ${bypassTime}`,
      onChange: (_, dateStr) => {
        if (!dateStr) return;
        const picked = dayjs(dateStr);
        if (picked.isValid()) {
          setBypassDate(picked.format("YYYY-MM-DD"));
          setBypassTime(picked.format("HH:mm"));
        }
      },
    });
    flatpickrRef.current = fp;

    return () => {
      fp.destroy();
      flatpickrRef.current = null;
    };
  }, [showBypass]);

  const handleApplyBypass = () => {
    if (!bypassDate) return;
    localStorage.setItem("OSM_BYPASS_ACTIVE", "true");
    localStorage.setItem("OSM_BYPASS_DATETIME", `${bypassDate} ${bypassTime}`);
    setBypassActive(true);
  };

  const handleResetBypass = () => {
    const { date: resetDate, time: resetTime } = getInitialBypassState();

    localStorage.removeItem("OSM_BYPASS_ACTIVE");
    localStorage.removeItem("OSM_BYPASS_DATETIME");
    setBypassActive(false);
    setBypassDate(resetDate);
    setBypassTime(resetTime);
    flatpickrRef.current?.setDate(`${resetDate} ${resetTime}`, true);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const submittedCount = callplans.filter(
    (cp) => String(cp.status || "").toUpperCase() === "SUBMITTED",
  ).length;
  const finalCount = callplans.filter(
    (cp) => String(cp.status || "").toUpperCase() === "FINAL",
  ).length;

  const canProceedToCalculation =
    statusFilter === "SUBMITTED" && submittedCount > 0 && !isLoading;
  const canProceedToPreparation =
    statusFilter === "FINAL" && finalCount > 0 && !isLoading;
  const calculateAllowedLabel = statusFilter === "FINAL" ? "DONE" : "YES";
  const calculateAllowedClass =
    statusFilter === "FINAL" ? "text-emerald-600" : "text-blue-600";
  const printAllowedLabel = statusFilter === "FINAL" ? "YES" : "NO";
  const printAllowedClass =
    statusFilter === "FINAL" ? "text-emerald-600" : "text-red-600";

  const totalItems = callplans.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCallplans = callplans.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, pageSize, totalItems]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      {/* Header & Breadcrumb */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-800">SPB Submitted</h1>
        <div className="text-sm text-gray-500 mt-1 flex gap-2">
          <span>Home</span>
          <span>&gt;</span>
          <span>SPB Submitted</span>
        </div>
      </div>

      {showBypass && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-yellow-800">
            Bypass Mode (QA Tool)
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-yellow-900">
                Pilih Tanggal & Jam Simulasi
              </label>
              <input
                ref={bypassDateTimeRef}
                type="text"
                defaultValue={`${bypassDate} ${bypassTime}`}
                className="w-56 rounded border border-yellow-300 bg-white px-2 py-1.5 text-sm"
                placeholder="Select date & time"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyBypass}
              className="rounded bg-yellow-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-yellow-700"
            >
              Apply Bypass
            </button>
            <button
              type="button"
              onClick={handleResetBypass}
              className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            >
              Reset
            </button>
          </div>
          <p className="mt-2 text-xs text-yellow-800">
            {bypassActive ? (
              <>
                Bypass aktif · API & UI memakai target callplan:{" "}
                <strong>{targetCallplanDate}</strong>
              </>
            ) : (
              <>
                Bypass nonaktif · target callplan otomatis H+1:{" "}
                <strong>{targetCallplanDate}</strong>
              </>
            )}
          </p>
        </div>
      )}

      {/* Info Alert Box */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-5 mb-6 shadow-sm">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="text-blue-500 mt-1" size={20} />
          <div className="text-sm text-gray-700 w-full">
            <h3 className="font-bold text-blue-700 text-base mb-2">
              Informasi Penarikan & Kalkulasi Stock On Hand (SOH)
            </h3>
            <p className="mb-2">
              Untuk mempersiapkan data SPB kunjungan tanggal{" "}
              <strong>{targetCallplanDate}</strong>
              {bypassActive ? " (via Bypass)" : " (proses dilakukan pada H-1)"}:
            </p>
            <ul className="list-disc pl-5 mb-3 space-y-1">
              <li>
                <strong>Tarik Data SOH Manual:</strong> Hanya dibuka pada pukul{" "}
                <strong>09:00 - 10:00 WIB</strong> di hari H-1.
              </li>
              <li>
                <strong>Tarik Data SOH Otomatis:</strong> Setelah melewati pukul{" "}
                <strong>10:00 WIB</strong>, sistem akan secara otomatis menarik
                data SOH apabila Anda belum sempat menariknya secara manual.
              </li>
              <li>
                Setelah data SOH tersedia (baik ditarik secara manual maupun
                otomatis), Anda tetap dapat melakukan kalkulasi dan men-submit
                hasilnya kapan saja untuk merubah status SPB dari{" "}
                <strong>SUBMITTED</strong> menjadi <strong>FINAL</strong>.
              </li>
            </ul>

            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-md mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Data SOH sudah ter-generate pada pukul{" "}
              <strong>04 Aug 2026 - 08:27</strong>.
            </div>

            <p className="font-semibold mb-1">Panduan Filter Status:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Pilih filter status <strong>SUBMITTED</strong> untuk memproses
                data SPB baru yang siap dicocokkan (Kalkulasi) dengan stok fisik
                (SOH).
              </li>
              <li>
                Pilih filter status <strong>FINAL</strong> untuk melihat daftar
                SPB yang telah selesai dikalkulasi dan langsung lanjut ke{" "}
                <strong>Goods Preparation</strong> (Print dokumen & perhitungan
                BTB).
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <h2 className="font-bold text-lg text-gray-800">
            SPB {statusFilter}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="FINAL">FINAL</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={fetchCallplans}
            disabled={isLoading}
            className="bg-white border border-orange-500 text-orange-600 hover:bg-orange-50 disabled:opacity-50 px-4 py-2 rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
          >
            <FaSyncAlt size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh Data
          </button>

          {statusFilter === "SUBMITTED" && (
            <button
              type="button"
              onClick={() => onProceedToCalculation(callplans)}
              disabled={!canProceedToCalculation}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
              title={
                canProceedToCalculation
                  ? "Lanjut ke halaman Calculation (SOH + rumus)"
                  : "Butuh minimal 1 SPB SUBMITTED"
              }
            >
              Lanjut ke Calculation
              <FaArrowRight size={12} />
            </button>
          )}

          {statusFilter === "FINAL" && (
            <button
              type="button"
              onClick={() => onProceedToPreparation(callplans)}
              disabled={!canProceedToPreparation}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
              title={
                canProceedToPreparation
                  ? "Lanjut ke Goods Preparation (Print & BTB)"
                  : "Butuh minimal 1 SPB FINAL"
              }
            >
              Lanjut ke Goods Preparation
              <FaArrowRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm flex gap-8">
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">
            {bypassActive ? "Simulated Time" : "Current Time"}
          </div>
          <div className="font-bold text-gray-800">{displayCurrentTime}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">
            Target Callplan Date
          </div>
          <div className="font-bold text-blue-600">{targetCallplanDate}</div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">
            Calculate Allowed
          </div>
          <div className={`font-bold ${calculateAllowedClass}`}>
            {calculateAllowedLabel}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">
            Print Allowed
          </div>
          <div className={`font-bold ${printAllowedClass}`}>
            {printAllowedLabel}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-orange-500 text-white text-xs uppercase">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 font-semibold tracking-wide">
                  CALLPLAN NUMBER
                </th>
                <th className="px-4 py-3 font-semibold tracking-wide">
                  NIK SALES
                </th>
                <th className="px-4 py-3 font-semibold tracking-wide">
                  NAMA SALES
                </th>
                <th className="px-4 py-3 font-semibold tracking-wide">
                  NAMA SPV
                </th>
                <th className="px-4 py-3 font-semibold tracking-wide">
                  NIK SPV
                </th>
                <th className="px-4 py-3 font-semibold tracking-wide">
                  TOTAL SKU
                </th>
                <th className="px-4 py-3 font-semibold tracking-wide">
                  START DATE
                </th>
                <th className="px-4 py-3 font-semibold tracking-wide">
                  END DATE
                </th>
                <th className="px-4 py-3 font-semibold tracking-wide">
                  STATUS
                </th>
              </tr>
            </thead>

            {isLoading ? (
              <tbody>
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    Memuat data Callplan...
                  </td>
                </tr>
              </tbody>
            ) : callplans.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={10} className="text-center py-8 text-gray-500">
                    Tidak ada data Callplan untuk status {statusFilter}.
                  </td>
                </tr>
              </tbody>
            ) : (
              paginatedCallplans.map((row) => (
                <tbody
                  key={row.id}
                  className="border-b border-gray-100 last:border-0"
                >
                  {/* Main Row */}
                  <tr
                    className={`hover:bg-gray-50 cursor-pointer ${
                      expandedRows[row.id] ? "bg-gray-50" : ""
                    }`}
                    onClick={() => toggleRow(row.id)}
                  >
                    <td className="px-4 py-4 text-orange-500">
                      {expandedRows[row.id] ? (
                        <FaChevronDown size={14} />
                      ) : (
                        <FaChevronRight size={14} />
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {row.callplan_number}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{row.sales_nik}</td>
                    <td className="px-4 py-4 text-gray-800 font-medium">
                      {row.sales_name}
                    </td>
                    <td className="px-4 py-4 text-gray-600">{row.sales_spv}</td>
                    <td className="px-4 py-4 text-gray-600">
                      {row.sales_spv_nik}
                    </td>
                    <td className="px-4 py-4 text-gray-800">
                      {row.details?.length || 0}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {row.callplan_date_start}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {row.callplan_date_end}
                    </td>
                    <td className="px-4 py-4 font-semibold text-gray-700">
                      {row.status}
                    </td>
                  </tr>

                  {/* Expanded Details Row */}
                  {expandedRows[row.id] && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-8 py-6 bg-white border-t border-gray-100"
                      >
                        {/* Summary Cards */}
                        <div className="flex gap-4 mb-6">
                          <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="text-xs font-semibold text-blue-400 mb-2 uppercase">
                              Total SKU SPB
                            </div>
                            <div className="text-2xl font-bold text-gray-800">
                              {row.details?.length || 0}{" "}
                              <span className="text-sm font-normal text-gray-500">
                                Item
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 bg-blue-50 border border-blue-100 rounded-lg p-4 shadow-sm">
                            <div className="text-xs font-semibold text-blue-500 mb-2 uppercase">
                              Total Qty SPB
                            </div>
                            <div className="text-2xl font-bold text-blue-600">
                              {row.details
                                ?.reduce(
                                  (acc, curr) =>
                                    acc + Number(curr.item_qty_suggestion),
                                  0,
                                )
                                .toLocaleString("id-ID") || 0}{" "}
                              <span className="text-sm font-normal text-blue-500">
                                BKS
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Inner Detail Table — max ~10 rows visible, scroll if more */}
                        {row.details && row.details.length > 0 ? (
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="max-h-[488px] overflow-y-auto">
                              <table className="w-full text-sm text-left">
                                <thead className="sticky top-0 z-10 bg-gray-50 text-gray-500 text-xs font-semibold uppercase border-b border-gray-200">
                                  <tr>
                                    <th className="px-6 py-3 w-16">NO</th>
                                    <th className="px-6 py-3">ITEM NAME</th>
                                    <th className="px-6 py-3">SKU</th>
                                    <th className="px-6 py-3 text-right">
                                      QTY SUGGESTION
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {row.details.map((detail, index) => (
                                    <tr
                                      key={detail.id}
                                      className="hover:bg-gray-50"
                                    >
                                      <td className="px-6 py-3 text-gray-500">
                                        {index + 1}
                                      </td>
                                      <td className="px-6 py-3 font-medium text-gray-800">
                                        {detail.item_code}
                                      </td>
                                      <td className="px-6 py-3 text-gray-400">
                                        {detail.item_code}
                                      </td>
                                      <td className="px-6 py-3 font-bold text-gray-800 text-right">
                                        {detail.item_qty_suggestion}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="sticky bottom-0 z-10 bg-gray-50 border-t border-gray-200">
                                  <tr>
                                    <td
                                      colSpan={3}
                                      className="px-6 py-3 text-right font-bold text-gray-600 uppercase text-xs"
                                    >
                                      TOTAL
                                    </td>
                                    <td className="px-6 py-3 text-right font-bold text-blue-600">
                                      {row.details
                                        .reduce(
                                          (acc, curr) =>
                                            acc +
                                            Number(curr.item_qty_suggestion),
                                          0,
                                        )
                                        .toLocaleString("id-ID")}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center p-4 border border-gray-200 rounded-lg text-gray-500">
                            Tidak ada detail SKU untuk Callplan ini.
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              ))
            )}
          </table>
        </div>
        {!isLoading && totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
              {totalItems} items
            </div>

            <div className="flex items-center gap-4">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm focus:outline-none"
              >
                <option value={10}>Show 10</option>
                <option value={20}>Show 20</option>
                <option value={50}>Show 50</option>
              </select>

              <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaChevronLeft size={12} />
                </button>
                <span>
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
