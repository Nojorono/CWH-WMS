import React, { useEffect, useMemo, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { FaInfoCircle, FaSyncAlt, FaArrowRight } from "react-icons/fa";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { Callplan } from "../../types/CallplanTypes";
import { callplanService } from "../../Services/CallplanService";
import { SPBViewProps } from "../../types/flow";
import dayjs from "dayjs";
import { showErrorToast } from "../../../../components/toast";
import SPBTable from "./SPBTable";

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
  // Draft = pilihan di picker (belum diterapkan)
  // Applied = baru dipakai API/UI setelah klik Apply Bypass
  const [draftBypassDate, setDraftBypassDate] = useState(() => {
    const saved = localStorage.getItem("OSM_BYPASS_DATETIME");
    if (saved) return saved.split(" ")[0];
    return getInitialBypassState().date;
  });
  const [draftBypassTime, setDraftBypassTime] = useState(() => {
    const saved = localStorage.getItem("OSM_BYPASS_DATETIME");
    if (saved?.split(" ")[1]) return saved.split(" ")[1];
    return getInitialBypassState().time;
  });
  const [appliedBypassDate, setAppliedBypassDate] = useState(() => {
    if (localStorage.getItem("OSM_BYPASS_ACTIVE") !== "true") return "";
    return localStorage.getItem("OSM_BYPASS_DATETIME")?.split(" ")[0] || "";
  });
  const [appliedBypassTime, setAppliedBypassTime] = useState(() => {
    if (localStorage.getItem("OSM_BYPASS_ACTIVE") !== "true") return "";
    return localStorage.getItem("OSM_BYPASS_DATETIME")?.split(" ")[1] || "";
  });
  const [bypassActive, setBypassActive] = useState(
    () => localStorage.getItem("OSM_BYPASS_ACTIVE") === "true",
  );
  const bypassDateTimeRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  const targetCallplanDate = useMemo(() => {
    if (bypassActive && appliedBypassDate) {
      return appliedBypassDate;
    }
    return dayjs().add(1, "day").format("YYYY-MM-DD");
  }, [bypassActive, appliedBypassDate]);

  const displayCurrentTime = useMemo(() => {
    if (bypassActive && appliedBypassDate && appliedBypassTime) {
      return dayjs(`${appliedBypassDate} ${appliedBypassTime}`).format(
        "DD MMM YYYY - HH:mm",
      );
    }
    return dayjs().format("DD MMM YYYY - HH:mm");
  }, [bypassActive, appliedBypassDate, appliedBypassTime]);

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
      showErrorToast("Gagal mengambil data callplan");
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
      defaultDate: `${draftBypassDate} ${draftBypassTime}`,
      onChange: (_, dateStr) => {
        // Hanya update draft — data API/UI belum berubah sampai Apply
        if (!dateStr) return;
        const picked = dayjs(dateStr);
        if (picked.isValid()) {
          setDraftBypassDate(picked.format("YYYY-MM-DD"));
          setDraftBypassTime(picked.format("HH:mm"));
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
    if (!draftBypassDate) return;
    localStorage.setItem("OSM_BYPASS_ACTIVE", "true");
    localStorage.setItem(
      "OSM_BYPASS_DATETIME",
      `${draftBypassDate} ${draftBypassTime}`,
    );
    setAppliedBypassDate(draftBypassDate);
    setAppliedBypassTime(draftBypassTime);
    setBypassActive(true);
  };

  const handleResetBypass = () => {
    const { date: resetDate, time: resetTime } = getInitialBypassState();

    localStorage.removeItem("OSM_BYPASS_ACTIVE");
    localStorage.removeItem("OSM_BYPASS_DATETIME");
    setBypassActive(false);
    setAppliedBypassDate("");
    setAppliedBypassTime("");
    setDraftBypassDate(resetDate);
    setDraftBypassTime(resetTime);
    // false = jangan fire onChange (hindari side-effect)
    flatpickrRef.current?.setDate(`${resetDate} ${resetTime}`, false);
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
        <div className="mt-1 flex gap-2 text-sm text-gray-500">
          <span>Home</span>
          <span>&gt;</span>
          <span>SPB Submitted</span>
        </div>
      </div>

      {showBypass && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <div className="mb-2 text-xs font-bold tracking-wide text-yellow-800 uppercase">
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
                defaultValue={`${draftBypassDate} ${draftBypassTime}`}
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
                {draftBypassDate !== appliedBypassDate ||
                draftBypassTime !== appliedBypassTime
                  ? ` · Draft belum di-Apply: ${draftBypassDate} ${draftBypassTime}`
                  : ""}
              </>
            ) : (
              <>
                Bypass nonaktif · target callplan otomatis H+1:{" "}
                <strong>{targetCallplanDate}</strong>
                {" · "}
                Pilih tanggal lalu klik <strong>Apply Bypass</strong> untuk
                menerapkan.
              </>
            )}
          </p>
        </div>
      )}

      {/* Info Alert Box */}
      <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50/50 p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="mt-1 text-blue-500" size={20} />
          <div className="w-full text-sm text-gray-700">
            <h3 className="mb-2 text-base font-bold text-blue-700">
              Informasi Penarikan & Kalkulasi Stock On Hand (SOH)
            </h3>
            <p className="mb-2">
              Untuk mempersiapkan data SPB kunjungan tanggal{" "}
              <strong>{targetCallplanDate}</strong>
              {bypassActive ? " (via Bypass)" : " (proses dilakukan pada H-1)"}:
            </p>
            <ul className="mb-3 list-disc space-y-1 pl-5">
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

            <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-green-700">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              Data SOH sudah ter-generate pada pukul{" "}
              <strong>04 Aug 2026 - 08:27</strong>.
            </div>

            <p className="mb-1 font-semibold">Panduan Filter Status:</p>
            <ul className="list-disc space-y-1 pl-5">
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
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-lg font-bold text-gray-800">
            SPB {statusFilter}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="FINAL">FINAL</option>
            </select>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            onClick={fetchCallplans}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded border border-orange-500 bg-white px-4 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50 disabled:opacity-50"
          >
            <FaSyncAlt size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh Data
          </button>

          {statusFilter === "SUBMITTED" && (
            <button
              type="button"
              onClick={() => onProceedToCalculation(callplans)}
              disabled={!canProceedToCalculation}
              className="flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
              className="flex items-center justify-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
      <div className="mb-6 flex gap-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <div className="mb-1 text-xs font-semibold text-gray-500">
            {bypassActive ? "Simulated Time" : "Current Time"}
          </div>
          <div className="font-bold text-gray-800">{displayCurrentTime}</div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-gray-500">
            Actual Target Callplan Date
          </div>
          <div className="font-bold text-blue-600">{targetCallplanDate}</div>
        </div>
      </div>

      <SPBTable
        data={paginatedCallplans}
        isLoading={isLoading}
        statusFilter={statusFilter}
        expandedRows={expandedRows}
        onToggleRow={toggleRow}
        currentPage={safeCurrentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
