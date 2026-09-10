import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowUp,
  FaFileExcel,
  FaSyncAlt,
} from "react-icons/fa";
import { buildMovementLines } from "./buildMovementLines";
import { formatPack, formatSigned } from "./format";
import { StockReportTab } from "./types";
import { useLhsReportData } from "./useLhsReportData";

dayjs.locale("id");

const TABS: { id: StockReportTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "incoming", label: "Incoming" },
  { id: "outgoing", label: "Outgoing" },
  { id: "validation", label: "Stock Validation" },
];

const VarianceBadge = ({ value }: { value: number }) => {
  const isZero = value === 0;
  const isNeg = value < 0;
  return (
    <span
      className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        isZero
          ? "bg-emerald-100 text-emerald-700"
          : isNeg
            ? "bg-rose-100 text-rose-700"
            : "bg-amber-100 text-amber-700"
      }`}
    >
      {formatSigned(value)}
    </span>
  );
};

function LaporanHarianStock() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StockReportTab>("overview");

  /** LHS: selalu current date (Callplan / SPB / SOH) — tanpa pilih tanggal */
  const reportDate = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

  const {
    context,
    rows,
    totals,
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
            <span className="font-semibold text-slate-500">(in pack)</span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {context.amoName} · {reportDateLabel}
            {salesCount > 0 ? ` · ${salesCount} SPB FINAL` : ""}
          </p>
          <p className="mt-1 max-w-2xl text-xs text-slate-400">
            Data hari ini (current date) · Stock Awal = SOH Calculation · META =
            SOH latest · SPB FINAL, Retur, BTB, FPPR &amp; Tambahan (1 cabang).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void refetch()}
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
            BTB + Retur DO + Inbound CWH
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
            DO MATIC + Add + FPPR
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
        <button
          type="button"
          onClick={() =>
            window.alert("Export Excel — layout penuh menyusul.")
          }
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <FaFileExcel size={14} /> Export ke Excel
        </button>
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">SKU Name</th>
                  <th className="px-4 py-3 text-right">Stock Awal</th>
                  <th className="px-4 py-3 text-right text-emerald-700">
                    Incoming
                  </th>
                  <th className="px-4 py-3 text-right text-rose-700">
                    Outgoing
                  </th>
                  <th className="px-4 py-3 text-right">Stock Akhir</th>
                  <th className="px-4 py-3 text-right">Fisik</th>
                  <th className="px-4 py-3 text-right">META</th>
                  <th className="px-4 py-3 text-center">Variance</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.kode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.skuName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatPack(row.stockAwal, false)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600">
                      {formatSigned(row.totalTerima)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-rose-600">
                      {formatSigned(-Math.abs(row.totalKeluar))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-indigo-700">
                      {formatPack(row.stockAkhir, false)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      —
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatPack(row.meta, false)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <VarianceBadge value={row.variance} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-12 text-center text-sm text-slate-400"
                    >
                      Tidak ada data untuk tanggal / cabang ini.
                    </td>
                  </tr>
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-orange-500 text-white">
                    <td
                      colSpan={2}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wide"
                    >
                      Total All (Pack)
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatPack(totals.stockAwal, false)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatSigned(totals.totalTerima)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatSigned(-Math.abs(totals.totalKeluar))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatPack(totals.stockAkhir, false)}
                    </td>
                    <td className="px-4 py-3 text-right text-white/70">—</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatPack(totals.meta, false)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-rose-700/90 px-2.5 py-0.5 text-xs font-bold text-white">
                        {formatSigned(totals.variance)}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {activeTab === "incoming" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">SKU Name</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">UOM</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incoming.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.kode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.skuName}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600">
                      +{formatPack(row.qty, false)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">PACK</td>
                    <td className="px-4 py-3 text-slate-600">{row.source}</td>
                  </tr>
                ))}
                {incoming.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-slate-400"
                    >
                      Tidak ada pergerakan incoming.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
              Source: Central (Inbound CWH) · Retur DO · BTB
            </p>
          </div>
        )}

        {activeTab === "outgoing" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">SKU Name</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">UOM</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outgoing.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.kode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.skuName}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-rose-600">
                      -{formatPack(row.qty, false)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">PACK</td>
                    <td className="px-4 py-3 text-slate-600">{row.source}</td>
                  </tr>
                ))}
                {outgoing.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-slate-400"
                    >
                      Tidak ada pergerakan outgoing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
              Source: Manual DO (FPPR) · Relokasi · DO MATIC · Add DO MATIC
            </p>
          </div>
        )}

        {activeTab === "validation" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Kode</th>
                  <th className="px-4 py-3">SKU Name</th>
                  <th className="px-4 py-3 text-right">Stock Akhir</th>
                  <th className="px-4 py-3 text-right">Fisik</th>
                  <th className="px-4 py-3 text-right">META</th>
                  <th className="px-4 py-3 text-center">VAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.kode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.skuName}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-indigo-700">
                      {formatPack(row.stockAkhir, false)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">—</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatPack(row.meta, false)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <VarianceBadge value={row.variance} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-slate-400"
                    >
                      Tidak ada data validasi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
              Fisik masih dikosongkan · VAR = Fisik − Stock Akhir · META = SOH
              latest (sama Good Prep)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LaporanHarianStock;
