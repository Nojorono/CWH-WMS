import React, { useEffect, useMemo, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { 
  FaSyncAlt, 
  FaArrowRight, 
  FaCalendarAlt, 
  FaClock, 
  FaFilter, 
  FaCheckCircle, 
  FaFileAlt 
} from "react-icons/fa";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { Callplan } from "../../types/CallplanTypes";
import { callplanService } from "../../Services/CallplanService";
import { SPBViewProps } from "../../types/flow";
import dayjs from "dayjs";
import { showErrorToast } from "../../../../components/toast";
import Select from "../../../../components/form/Select";
import SPBTable from "./SPBTable";
import { SortDirection, sortCallplans } from "./spbTableConfig";

const TODAY = () => dayjs().format("YYYY-MM-DD");
const H_PLUS_1 = () => dayjs().add(1, "day").format("YYYY-MM-DD");

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "SUBMITTED" },
  { value: "FINAL", label: "FINAL" },
  { value: "VOID", label: "VOID" },
  { value: "VOID_NEED_ACTION", label: "VOID_NEED_ACTION" },
];

const getInitialBypassState = () => {
  const now = dayjs();
  return {
    date: TODAY(),
    time: now.format("HH:mm"),
  };
};

const getResetBypassState = () => {
  const now = dayjs();
  return {
    date: H_PLUS_1(),
    time: now.format("HH:mm"),
  };
};

export default function SPBView({
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
  const [sortKey, setSortKey] = useState("callplan_date_start");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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
    () => localStorage.getItem("OSM_BYPASS_ACTIVE") === "true"
  );

  const bypassDateTimeRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  const targetCallplanDate = useMemo(() => {
    if (bypassActive && appliedBypassDate) {
      return appliedBypassDate;
    }
    return H_PLUS_1();
  }, [bypassActive, appliedBypassDate]);

  const displayCurrentTime = useMemo(() => {
    if (bypassActive && appliedBypassDate && appliedBypassTime) {
      return dayjs(`${appliedBypassDate} ${appliedBypassTime}`).format(
        "DD MMM YYYY - HH:mm"
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
      dateFormat: "Y-m-d",
      defaultDate: draftBypassDate,
      allowInput: false,
      onChange: (selectedDates) => {
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
  }, []);

  const handleApplyBypass = () => {
    if (!draftBypassDate) return;
    localStorage.setItem("OSM_BYPASS_ACTIVE", "true");
    localStorage.setItem(
      "OSM_BYPASS_DATETIME",
      `${draftBypassDate} ${draftBypassTime}`
    );
    setAppliedBypassDate(draftBypassDate);
    setAppliedBypassTime(draftBypassTime);
    setBypassActive(true);
  };

  const handleResetBypass = () => {
    const { date: resetDate, time: resetTime } = getResetBypassState();

    localStorage.removeItem("OSM_BYPASS_ACTIVE");
    localStorage.removeItem("OSM_BYPASS_DATETIME");
    setBypassActive(false);
    setAppliedBypassDate("");
    setAppliedBypassTime("");
    setDraftBypassDate(resetDate);
    setDraftBypassTime(resetTime);
    flatpickrRef.current?.setDate(resetDate, false);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const submittedCount = callplans.filter(
    (cp) => String(cp.status || "").toUpperCase() === "SUBMITTED"
  ).length;
  const finalCount = callplans.filter(
    (cp) => String(cp.status || "").toUpperCase() === "FINAL"
  ).length;

  const canProceedToCalculation =
    statusFilter === "SUBMITTED" && submittedCount > 0 && !isLoading;
  const canProceedToPreparation =
    statusFilter === "FINAL" && finalCount > 0 && !isLoading;

  const sortedCallplans = useMemo(
    () => sortCallplans(callplans, sortKey, sortDirection),
    [callplans, sortKey, sortDirection]
  );

  const totalItems = sortedCallplans.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCallplans = sortedCallplans.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, pageSize, totalItems, sortKey, sortDirection]);

  return (
    <div className="min-h-screen p-6 text-slate-800 font-sans">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header & Meta Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              SPB Overview
            </h1>
          </div>

          {/* Quick Info Badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 shadow-sm">
              <FaClock className="text-slate-400" size={14} />
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                  {bypassActive ? "Selected Time" : "Current Time"}
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {displayCurrentTime}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3.5 py-2 shadow-sm">
              <FaCalendarAlt className="text-indigo-500" size={14} />
              <div>
                <div className="text-[10px] font-semibold tracking-wider text-indigo-400 uppercase">
                  Target Date
                </div>
                <div className="text-xs font-bold text-indigo-700">
                  {targetCallplanDate}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector Bypass Section */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                <h3 className="text-sm font-semibold text-slate-800">
                  Filter Tanggal Callplan
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {bypassActive ? (
                  <>
                    Tanggal aktif untuk fetch data SPB:{" "}
                    <strong className="text-slate-700">{targetCallplanDate}</strong>
                    {draftBypassDate !== appliedBypassDate && (
                      <span className="ml-1 text-amber-600">
                        (Draft belum diterapkan: {draftBypassDate})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Menampilkan target otomatis H+1:{" "}
                    <strong className="text-slate-700">{targetCallplanDate}</strong>
                  </>
                )}
              </p>
            </div>

            {/* Inputs & Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <input
                  ref={bypassDateTimeRef}
                  type="text"
                  readOnly
                  defaultValue={draftBypassDate}
                  className="w-44 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Pilih tanggal"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyBypass}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
              >
                Terapkan
              </button>

              <button
                type="button"
                onClick={handleResetBypass}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                Reset H+1
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area: Toolbar & Table */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          
          {/* Table Control Header */}
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            
            {/* Filter Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FaFilter size={11} className="text-slate-400" />
                <span className="font-medium">Status:</span>
                <Select
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(value) => setStatusFilter(String(value || "SUBMITTED"))}
                  placeholder="Pilih status"
                  width="200px"
                  className="text-xs"
                />
              </div>

              <button
                onClick={fetchCallplans}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                <FaSyncAlt size={12} className={isLoading ? "animate-spin text-indigo-600" : "text-slate-400"} />
                Refresh
              </button>
            </div>

            {/* Dynamic Next Action Button */}
            <div className="flex items-center gap-2">
              {statusFilter === "SUBMITTED" && (
                <button
                  type="button"
                  onClick={() => onProceedToCalculation(callplans)}
                  disabled={!canProceedToCalculation}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <span>Lanjut ke Calculation</span>
                  <FaArrowRight size={11} />
                </button>
              )}

              {statusFilter === "FINAL" && (
                <button
                  type="button"
                  onClick={() => onProceedToPreparation(callplans)}
                  disabled={!canProceedToPreparation}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                >
                  <span>Lanjut ke Goods Preparation</span>
                  <FaArrowRight size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className="p-2">
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
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSortChange={(nextKey, nextDirection) => {
                setSortKey(nextKey);
                setSortDirection(nextDirection);
              }}
              onVoidActionComplete={() => setStatusFilter("VOID")}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

