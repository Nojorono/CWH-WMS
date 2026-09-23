import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import { FaArrowDown, FaArrowLeft, FaArrowUp, FaSyncAlt } from "react-icons/fa";
import { formatPack, formatSigned } from "./logic";
import { StockReportTab } from "./types";
import { useLhsReportData } from "./useLhsReportData";
import OverviewTab from "./components/OverviewTab";
import IncomingTab from "./components/IncomingTab";
import OutgoingTab from "./components/OutgoingTab";
import ExportLhsExcelButton from "./components/ExportLhsExcelButton";
import DeferredMount from "../../../../components/common/DeferredMount";
import { lhsReportService } from "../../../../API/services/outbound-salesman/LhsReportService";

dayjs.locale("id");

const TABS: { id: StockReportTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "incoming", label: "Incoming" },
  { id: "outgoing", label: "Outgoing" },
];

function LaporanHarianStockPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StockReportTab>("overview");

  /** LHS: selalu current date — tanpa pilih tanggal */
  const reportDate = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const {
    context,
    rows,
    totals,
    detail,
    incoming,
    outgoing,
    isLoading,
    error,
    refetch,
    reportDateLabel,
    previousDateLabel,
  } = useLhsReportData(reportDate);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Laporan Stock Harian Gudang{" "}
            <span className="font-semibold text-slate-500">
              (Bungkus / BKS)
            </span>
          </h1>
          <div className="space-y-2">
            {/* Primary Context Header */}
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                {context.amoName}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {reportDateLabel}
              </span>
            </div>

            {/* Formula & Calculation Legend */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 shadow-2xs backdrop-blur-xs">
              <span className="font-medium text-slate-700 pr-1">
                Informasi
              </span>
              <span className="px-2 py-0.5 bg-white border border-slate-200/80 rounded-md text-slate-600 shadow-2xs">
                <strong className="text-slate-800 font-medium">
                  Stock Awal
                </strong>{" "}
                = Stock {previousDateLabel || "previous_date"}
              </span>
              <span className="text-slate-300">·</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200/80 rounded-md text-slate-600 shadow-2xs">
                <strong className="text-slate-800 font-medium">META</strong> =
                Stock {reportDateLabel}
              </span>
              <span className="text-slate-300">·</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200/80 rounded-md text-slate-600 shadow-2xs">
                <strong className="text-slate-800 font-medium">
                  Stock Akhir
                </strong>{" "}
                = Awal + Incoming − Outgoing (FE)
              </span>
              <span className="text-slate-300">·</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200/80 rounded-md text-slate-600 shadow-2xs">
                <strong className="text-slate-800 font-medium">Variance</strong>{" "}
                = META − Stock Akhir
              </span>
            </div>
          </div>
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
      {/* <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Stock Awal
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {formatPack(totals.stockAwal, false)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Dari API LHS</p>
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
            Agregat Incoming API
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
            Agregat Outgoing API
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
      </div> */}

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
          detail={detail}
          amoName={context.amoName}
          reportDateLabel={reportDateLabel}
          disabled={isLoading}
          fetchDetail={async () =>
            lhsReportService.getDetail(reportDate).catch(() => null)
          }
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
          <OverviewTab
            rows={rows}
            totals={totals}
            isLoading={isLoading}
            previousDateLabel={previousDateLabel}
            reportDateLabel={reportDateLabel}
          />
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

function LaporanHarianStock() {
  return (
    <DeferredMount delayMs={180}>
      <LaporanHarianStockPage />
    </DeferredMount>
  );
}

export default LaporanHarianStock;
