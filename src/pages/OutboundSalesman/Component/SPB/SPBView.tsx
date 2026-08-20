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

const TODAY = () => dayjs().format("YYYY-MM-DD");
const H_PLUS_1 = () => dayjs().add(1, "day").format("YYYY-MM-DD");

const getInitialBypassState = () => {
  const now = dayjs();
  return {
    date: TODAY(), // default picker: DateNow
    time: now.format("HH:mm"),
  };
};

/** Reset target: selalu H+1 (besok) */
const getResetBypassState = () => {
  const now = dayjs();
  return {
    date: H_PLUS_1(),
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
  // Draft = pilihan di picker (belum diterapkan)
  // Applied = baru dipakai API/UI setelah klik Terapkan
  // Default selalu DateNow (YYYY-MM-DD); localStorage hanya jika bypass aktif
  const [draftBypassDate, setDraftBypassDate] = useState(() => {
    if (localStorage.getItem("OSM_BYPASS_ACTIVE") === "true") {
      const saved = localStorage.getItem("OSM_BYPASS_DATETIME")?.split(" ")[0];
      if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved) && dayjs(saved).isValid()) {
        return saved;
      }
    }
    return TODAY();
  });
  const [draftBypassTime, setDraftBypassTime] = useState(() => {
    if (localStorage.getItem("OSM_BYPASS_ACTIVE") === "true") {
      const saved = localStorage.getItem("OSM_BYPASS_DATETIME")?.split(" ")[1];
      if (saved) return saved;
    }
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
    // Belum Terapkan → default otomatis H+1
    return H_PLUS_1();
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
    if (!bypassDateTimeRef.current) return;

    const fp = flatpickr(bypassDateTimeRef.current, {
      enableTime: false,
      dateFormat: "Y-m-d", // tampilan: 2026-08-04
      defaultDate: draftBypassDate,
      allowInput: false,
      onChange: (selectedDates) => {
        // Hanya update draft — data API/UI belum berubah sampai Terapkan
        if (!selectedDates?.[0]) return;
        const picked = dayjs(selectedDates[0]);
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
    // Init sekali; perubahan tanggal di-handle via onChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // Reset ke H+1: hari ini 2026-08-14 → 2026-08-15
    const { date: resetDate, time: resetTime } = getResetBypassState();

    localStorage.removeItem("OSM_BYPASS_ACTIVE");
    localStorage.removeItem("OSM_BYPASS_DATETIME");
    setBypassActive(false);
    setAppliedBypassDate("");
    setAppliedBypassTime("");
    setDraftBypassDate(resetDate);
    setDraftBypassTime(resetTime);
    // false = jangan fire onChange (hindari side-effect)
    flatpickrRef.current?.setDate(resetDate, false);
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

      {/* Select Date — fitur pilih tanggal callplan untuk get SPB */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div className="mb-2 text-xs font-bold tracking-wide text-blue-800 uppercase">
          Pilih Tanggal Callplan
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-blue-900">
              Tanggal Callplan
            </label>
            <input
              ref={bypassDateTimeRef}
              type="text"
              readOnly
              defaultValue={draftBypassDate}
              className="w-56 cursor-pointer rounded border border-blue-300 bg-white px-2 py-1.5 text-sm"
              placeholder="Pilih tanggal"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyBypass}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
          >
            Terapkan
          </button>
          <button
            type="button"
            onClick={handleResetBypass}
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Reset ke H+1
          </button>
        </div>
        <p className="mt-2 text-xs text-blue-800">
          {bypassActive ? (
            <>
              Tanggal aktif untuk get SPB: <strong>{targetCallplanDate}</strong>
              {draftBypassDate !== appliedBypassDate
                ? ` · Draft belum diterapkan: ${draftBypassDate}`
                : ""}
            </>
          ) : (
            <>
              Belum memilih tanggal khusus · target callplan otomatis H+1:{" "}
              <strong>{targetCallplanDate}</strong>
              {" · "}
              Pilih tanggal lalu klik <strong>Terapkan</strong> untuk memuat
              data SPB.
            </>
          )}
        </p>
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
              <option value="VOID">VOID</option>
              <option value="VOID_NEED_ACTION">VOID_NEED_ACTION</option>
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
            {bypassActive ? "Selected Date Time" : "Current Time"}
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
        onVoidActionComplete={fetchCallplans}
      />
    </div>
  );
}
