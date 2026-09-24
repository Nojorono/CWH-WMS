import React, { useEffect, useMemo, useRef, useState } from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { FaSyncAlt, FaArrowRight, FaFilter, FaCheckCircle } from "react-icons/fa";
import { usePersistAuthStore } from "../../../../API/store/AuthStore/PersistAuthStore";
import { useOutboundSalesmanCache } from "../../../../API/store/OutboundSalesmanStore/useOutboundSalesmanCache";
import { Callplan } from "../../types/CallplanTypes";
import { SPBViewProps } from "../../types/flow";
import dayjs from "dayjs";
import { showErrorToast, showSuccessToast } from "../../../../components/toast";
import { showConfirmDialog } from "../../../../components/swal-confirm";
import Select from "../../../../components/form/Select";
import SPBTable from "./SPBTable";
import { SortDirection, sortCallplans } from "./spbTableConfig";
import { getSpbOverviewNavLock, SPB_OVERVIEW_ACCESS } from "./spbOverviewAccessRules";
import {
  FPPR_AWAL_MO_TYPE,
  FPPR_TAMBAHAN_MO_TYPE,
  isFpprAwalMoType,
  isFpprTambahanMoType,
} from "../Calculation/calculationMoType";
import { finalizeFpprTambahanSpb } from "./finalizeFpprTambahan";

const TODAY = () => dayjs().format("YYYY-MM-DD");
const H_PLUS_1 = () => dayjs().add(1, "day").format("YYYY-MM-DD");

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "SUBMITTED" },
  { value: "FINAL", label: "FINAL" },
  { value: "VOID", label: "VOID" },
  { value: "VOID_NEED_ACTION", label: "VOID_NEED_ACTION" },
  { value: "COMPLETED", label: "COMPLETED" },
];

/**
 * Query ke-3 fetch SPB: mo_type — HANYA dipakai saat status = SUBMITTED.
 * FINAL / VOID / COMPLETED / dll → tanpa mo_type (semua tipe campur).
 */
const MO_TYPE_OPTIONS = [
  { value: FPPR_AWAL_MO_TYPE, label: "FPPR Awal" },
  { value: FPPR_TAMBAHAN_MO_TYPE, label: "FPPR Tambahan" },
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
  const [moTypeFilter, setMoTypeFilter] = useState(FPPR_AWAL_MO_TYPE);
  const [isFinalizingTambahan, setIsFinalizingTambahan] = useState(false);
  const [finalizeProgress, setFinalizeProgress] = useState({
    current: 0,
    total: 0,
  });
  const isFinalizingRef = useRef(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("callplan_date_start");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const [draftBypassDate, setDraftBypassDate] = useState(() => {
    if (localStorage.getItem("OSM_BYPASS_ACTIVE") === "true") {
      const saved = localStorage.getItem("OSM_BYPASS_DATETIME")?.split(" ")[0];
      if (
        saved &&
        /^\d{4}-\d{2}-\d{2}$/.test(saved) &&
        dayjs(saved).isValid()
      ) {
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

  const [bypassActive, setBypassActive] = useState(
    () => localStorage.getItem("OSM_BYPASS_ACTIVE") === "true",
  );

  /** Bypass rahasia Calculation di backdate — Ctrl+B (session saja) */
  const [calcBackdateBypass, setCalcBackdateBypass] = useState(
    () =>
      sessionStorage.getItem(
        SPB_OVERVIEW_ACCESS.CALC_BACKDATE_BYPASS_SESSION_KEY,
      ) === "true",
  );

  const bypassDateTimeRef = useRef<HTMLInputElement>(null);
  const flatpickrRef = useRef<flatpickr.Instance | null>(null);

  const targetCallplanDate = useMemo(() => {
    if (bypassActive && appliedBypassDate) {
      return appliedBypassDate;
    }
    return H_PLUS_1();
  }, [bypassActive, appliedBypassDate]);

  const isSubmittedStatus = statusFilter === "SUBMITTED";

  const fetchCallplans = async (options?: {
    force?: boolean;
    signal?: AbortSignal;
  }) => {
    if (!organization_id) return;

    setIsLoading(true);
    try {
      // mo_type hanya untuk SUBMITTED (pisah Calculation vs Finalize).
      // FINAL / VOID / COMPLETED / dll → semua tipe FPPR (campur).
      const data = await useOutboundSalesmanCache.getState().getCallplans(
        {
          dateStart: targetCallplanDate,
          organizationId: organization_id,
          status: statusFilter,
          ...(isSubmittedStatus && moTypeFilter
            ? { mo_type: moTypeFilter }
            : {}),
        },
        { force: options?.force, signal: options?.signal },
      );

      if (options?.signal?.aborted) return;
      setCallplans(data);
      setExpandedRows(data[0] ? { [data[0].id]: true } : {});
    } catch (error: any) {
      if (
        options?.signal?.aborted ||
        error?.name === "CanceledError" ||
        error?.name === "AbortError" ||
        error?.code === "ERR_CANCELED"
      ) {
        return;
      }
      console.error("Error fetching callplans:", error);
      setCallplans([]);
      setExpandedRows({});
      showErrorToast("Gagal mengambil data callplan");
    } finally {
      if (!options?.signal?.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    void fetchCallplans({ signal: ac.signal });
    return () => ac.abort();
    // moTypeFilter hanya mempengaruhi fetch saat status SUBMITTED
  }, [
    organization_id,
    statusFilter,
    targetCallplanDate,
    isSubmittedStatus ? moTypeFilter : null,
  ]);

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
      `${draftBypassDate} ${draftBypassTime}`,
    );
    setAppliedBypassDate(draftBypassDate);
    setBypassActive(true);
  };

  const handleResetBypass = () => {
    const { date: resetDate, time: resetTime } = getResetBypassState();

    localStorage.removeItem("OSM_BYPASS_ACTIVE");
    localStorage.removeItem("OSM_BYPASS_DATETIME");
    setBypassActive(false);
    setAppliedBypassDate("");
    setDraftBypassDate(resetDate);
    setDraftBypassTime(resetTime);
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

  /**
   * Lock navigasi backdate — aturan di:
   * ./spbOverviewAccessRules.ts
   * Bypass Calculation backdate: Ctrl+B
   */
  const navLock = useMemo(
    () =>
      getSpbOverviewNavLock({
        callplanDate: targetCallplanDate,
        bypassBackdateCalculation: calcBackdateBypass,
      }),
    [targetCallplanDate, calcBackdateBypass],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Ctrl+B (Windows/Linux) — toggle bypass Calculation backdate
      if (!(event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey)) {
        return;
      }
      if (event.key.toLowerCase() !== "b") return;

      const target = event.target as HTMLElement | null;
      const tag = String(target?.tagName || "").toUpperCase();
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      setCalcBackdateBypass((prev) => {
        const next = !prev;
        sessionStorage.setItem(
          SPB_OVERVIEW_ACCESS.CALC_BACKDATE_BYPASS_SESSION_KEY,
          String(next),
        );
        if (next) {
          showSuccessToast(
            "Bypass aktif: Calculation & Finalize diizinkan untuk backdate.",
          );
        } else {
          showSuccessToast("Bypass Calculation backdate dimatikan.");
        }
        return next;
      });
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const canProceedToCalculation =
    statusFilter === "SUBMITTED" &&
    isFpprAwalMoType(moTypeFilter) &&
    submittedCount > 0 &&
    !isLoading &&
    !isFinalizingTambahan &&
    !navLock.lockCalculation;

  const canFinalizeTambahan =
    statusFilter === "SUBMITTED" &&
    isFpprTambahanMoType(moTypeFilter) &&
    submittedCount > 0 &&
    !isLoading &&
    !isFinalizingTambahan &&
    !navLock.lockCalculation;

  const canProceedToPreparation =
    statusFilter === "FINAL" &&
    finalCount > 0 &&
    !isLoading &&
    !isFinalizingTambahan &&
    !navLock.lockGoodPrep;

  const handleFinalizeFpprTambahan = () => {
    if (isFinalizingRef.current || !canFinalizeTambahan) return;

    if (navLock.lockCalculation) {
      showErrorToast(
        navLock.reason ||
          "Finalize FPPR Tambahan dikunci untuk tanggal backdate.",
      );
      return;
    }

    const targets = callplans.filter(
      (cp) =>
        String(cp.status || "").toUpperCase() === "SUBMITTED" &&
        isFpprTambahanMoType(cp.mo_type),
    );

    if (targets.length === 0) {
      showErrorToast(
        "Tidak ada SPB FPPR Tambahan berstatus SUBMITTED untuk di-finalize.",
      );
      return;
    }

    showConfirmDialog(
      async () => {
        if (isFinalizingRef.current) return;
        isFinalizingRef.current = true;
        setIsFinalizingTambahan(true);
        setFinalizeProgress({ current: 0, total: 0 });

        try {
          const finalized = await finalizeFpprTambahanSpb(targets, {
            onProgress: setFinalizeProgress,
          });

          showSuccessToast(
            `${finalized.length} SPB FPPR Tambahan berhasil di-finalize (FINAL).`,
          );

          useOutboundSalesmanCache
            .getState()
            .invalidateCallplans(organization_id, targetCallplanDate);

          onProceedToPreparation(finalized);
        } catch (error) {
          console.error("Finalize FPPR Tambahan gagal:", error);
          showErrorToast(
            error instanceof Error
              ? error.message
              : "Gagal finalize SPB FPPR Tambahan",
          );
        } finally {
          isFinalizingRef.current = false;
          setIsFinalizingTambahan(false);
          setFinalizeProgress({ current: 0, total: 0 });
        }
      },
      {
        title: "Finalize FPPR Tambahan?",
        text: `${targets.length} SPB akan di-set Qty Submitted = Qty Final = Suggestion, status → FINAL (tanpa Calculation/SOH), lalu lanjut ke Goods Preparation.`,
        confirmButtonText: "Ya, Finalize & Lanjut Good Prep",
        cancelButtonText: "Batal",
      },
    );
  };

  const sortedCallplans = useMemo(
    () => sortCallplans(callplans, sortKey, sortDirection),
    [callplans, sortKey, sortDirection],
  );

  const totalItems = sortedCallplans.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCallplans = sortedCallplans.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, moTypeFilter, pageSize, totalItems, sortKey, sortDirection]);

  return (
    <div className="relative min-h-screen p-6 text-slate-800 font-sans">
      {isFinalizingTambahan && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="px-6 text-center text-sm font-semibold text-slate-700">
            Finalize FPPR Tambahan…
          </p>
          {finalizeProgress.total > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Batch {finalizeProgress.current} / {finalizeProgress.total}
            </p>
          )}
          <p className="mt-2 max-w-sm text-center text-[11px] text-slate-400">
            Qty Submitted &amp; Final = Suggestion · Status → FINAL
          </p>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header & Meta Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              SPB Overview
            </h1>
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
                    <strong className="text-slate-700">
                      {targetCallplanDate}
                    </strong>
                    {draftBypassDate !== appliedBypassDate && (
                      <span className="ml-1 text-amber-600">
                        (Draft belum diterapkan: {draftBypassDate})
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Menampilkan target otomatis H+1:{" "}
                    <strong className="text-slate-700">
                      {targetCallplanDate}
                    </strong>
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
            {/* Filter Status + MO Type */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <FaFilter size={11} className="text-slate-400" />
                <span className="font-medium">Status:</span>
                <Select
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(value) =>
                    setStatusFilter(String(value || "SUBMITTED"))
                  }
                  placeholder="Pilih status"
                  width="200px"
                  className="text-xs"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-medium">FPPR Type:</span>
                {isSubmittedStatus ? (
                  <Select
                    options={MO_TYPE_OPTIONS}
                    value={moTypeFilter}
                    onChange={(value) =>
                      setMoTypeFilter(String(value || FPPR_AWAL_MO_TYPE))
                    }
                    placeholder="Pilih FPPR Type"
                    width="180px"
                    className="text-xs"
                    disabled={isFinalizingTambahan}
                  />
                ) : (
                  <span
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500"
                    title="Status selain SUBMITTED menampilkan semua tipe FPPR (sudah lewat Calculation/Finalize)"
                  >
                    Semua FPPR
                  </span>
                )}
              </div>

              <button
                onClick={() => void fetchCallplans({ force: true })}
                disabled={isLoading || isFinalizingTambahan}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                <FaSyncAlt
                  size={12}
                  className={
                    isLoading
                      ? "animate-spin text-indigo-600"
                      : "text-slate-400"
                  }
                />
                Refresh
              </button>
            </div>

            {/* Dynamic Next Action Button — lock rule: spbOverviewAccessRules.ts */}
            <div className="flex flex-col items-end gap-1.5">
              {navLock.lockCalculation && (
                <p className="max-w-sm text-right text-[14px] font-medium text-amber-700">
                  Backdate: Calculation dikunci — Good Prep tetap boleh.
                </p>
              )}
              {navLock.isBackdate && navLock.calculationBypassActive && (
                <p className="max-w-sm text-right text-[11px] font-medium text-emerald-700">
                  Bypass Calculation backdate aktif.
                </p>
              )}
              <div className="flex items-center gap-2">
                {statusFilter === "SUBMITTED" &&
                  isFpprAwalMoType(moTypeFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (navLock.lockCalculation) {
                        showErrorToast(
                          navLock.reason ||
                            "Calculation dikunci untuk tanggal backdate.",
                        );
                        return;
                      }
                      onProceedToCalculation(callplans);
                    }}
                    disabled={!canProceedToCalculation}
                    title={
                      navLock.lockCalculation
                        ? navLock.reason || undefined
                        : undefined
                    }
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    <span>Lanjut ke Calculation</span>
                    <FaArrowRight size={11} />
                  </button>
                )}

                {statusFilter === "SUBMITTED" &&
                  isFpprTambahanMoType(moTypeFilter) && (
                  <button
                    type="button"
                    onClick={handleFinalizeFpprTambahan}
                    disabled={!canFinalizeTambahan}
                    title={
                      navLock.lockCalculation
                        ? navLock.reason || undefined
                        : "Finalize tanpa Calculation/SOH — Qty = Suggestion, status FINAL"
                    }
                    className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    {isFinalizingTambahan ? (
                      <>
                        <FaSyncAlt size={11} className="animate-spin" />
                        <span>Sedang Finalize…</span>
                      </>
                    ) : (
                      <>
                        <FaCheckCircle size={11} />
                        <span>Finalize SPB (tanpa kalkulasi)</span>
                      </>
                    )}
                  </button>
                )}

                {statusFilter === "FINAL" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (navLock.lockGoodPrep) {
                        showErrorToast(
                          navLock.reason ||
                            "Good Prep dikunci untuk tanggal backdate.",
                        );
                        return;
                      }
                      onProceedToPreparation(callplans);
                    }}
                    disabled={!canProceedToPreparation}
                    title={
                      navLock.lockGoodPrep
                        ? navLock.reason || undefined
                        : undefined
                    }
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    <span>Lanjut ke Goods Preparation</span>
                    <FaArrowRight size={11} />
                  </button>
                )}
              </div>
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
              onVoidActionComplete={() => {
                useOutboundSalesmanCache
                  .getState()
                  .invalidateCallplans(organization_id, targetCallplanDate);
                setStatusFilter("VOID");
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
