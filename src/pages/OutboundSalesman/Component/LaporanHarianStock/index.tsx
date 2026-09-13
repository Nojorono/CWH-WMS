import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowUp,
  FaSyncAlt,
} from "react-icons/fa";
import { buildMovementLines, formatPack, formatSigned } from "./logic";
import { StockReportTab } from "./types";
import { useLhsReportData } from "./useLhsReportData";
import OverviewTab from "./components/OverviewTab";
import IncomingTab from "./components/IncomingTab";
import OutgoingTab from "./components/OutgoingTab";
import ExportLhsExcelButton from "./components/ExportLhsExcelButton";

dayjs.locale("id");

const TABS: { id: StockReportTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "incoming", label: "Incoming" },
  { id: "outgoing", label: "Outgoing" },
];

function LaporanHarianStock() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StockReportTab>("overview");

  /** LHS: selalu current date (Callplan / SPB / SOH) — tanpa pilih tanggal */
  const reportDate = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const {
    context,
    rows,
    totals,
    finalCallplans,
    btbList,
    isLoading,
    error,
    refetch,
    salesCount,
    reportDateLabel,
  } = useLhsReportData(reportDate);

  const { incoming, outgoing } = useMemo(
    () => buildMovementLines(rows),
    [rows],
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Laporan Harian Stock Gudang{" "}
            <span className="font-semibold text-slate-500">(Bungkus / Bks)</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {context.amoName} · {reportDateLabel}
            {salesCount > 0 ? ` · ${salesCount} SPB FINAL` : ""}
          </p>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Data hari ini (current date) · Stock Awal = SOH Calculation · META =
            SOH latest · Incoming: SPB Adj (−) + BTB · Outgoing: SPB Submitted /
            FPPR / SPB Adj (+)
            (1 cabang).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch({ force: true })}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <FaSyncAlt size={12} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <FaArrowLeft size={12} /> Kembali
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Stock Awal
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {formatPack(totals.stockAwal, false)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Stock On Hand</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Incoming (Terima)
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatSigned(totals.totalTerima)}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <FaArrowUp className="text-emerald-500" size={10} />
            BTB + SPB Adjustment (−)
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Outgoing (Keluar)
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {formatSigned(-Math.abs(totals.totalKeluar))}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <FaArrowDown className="text-rose-500" size={10} />
            SPB Submitted + SPB Adj (+) + FPPR
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Variance (Fisik − Akhir)
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {formatSigned(totals.variance)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Stock Akhir {formatPack(totals.stockAkhir, false)}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Tabs + Export */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-1 border-b border-slate-200">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-b-2 border-orange-500 text-orange-600"
                    : "text-slate-500 hover:text-orange-500"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <ExportLhsExcelButton
          rows={rows}
          finalCallplans={finalCallplans}
          btbList={btbList}
          amoName={context.amoName}
          reportDateLabel={reportDateLabel}
          disabled={isLoading}
        />
      </div>

      {/* Tab panels */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow">
              <FaSyncAlt className="animate-spin" size={14} /> Memuat data…
            </div>
          </div>
        )}

        {activeTab === "overview" && (
          <OverviewTab rows={rows} totals={totals} isLoading={isLoading} />
        )}
        {activeTab === "incoming" && (
          <IncomingTab lines={incoming} isLoading={isLoading} />
        )}
        {activeTab === "outgoing" && (
          <OutgoingTab lines={outgoing} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
}

export default LaporanHarianStock;
