import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/id";
import {
  FaArrowLeft,
  FaFileExcel,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import {
  DUMMY_DO_DATE,
  DUMMY_INCOMING_ROWS,
  DUMMY_OUTGOING_ROWS,
  DUMMY_OVERVIEW_ROWS,
  DUMMY_SUMMARY,
} from "./dummyData";
import { StockReportTab } from "./types";

dayjs.locale("id");

const formatQty = (n: number) =>
  n.toLocaleString("id-ID", { maximumFractionDigits: 0 });

const formatSignedQty = (n: number) => {
  const abs = formatQty(Math.abs(n));
  if (n > 0) return `+${abs}`;
  if (n < 0) return `-${abs}`;
  return abs;
};

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
      {formatSignedQty(value)}
    </span>
  );
};

const TABS: { id: StockReportTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "incoming", label: "Incoming" },
  { id: "outgoing", label: "Outgoing" },
  { id: "validation", label: "Stock Validation" },
];

function LaporanHarianStock() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<StockReportTab>("overview");

  const doDateLabel = useMemo(() => {
    const d = dayjs(DUMMY_DO_DATE);
    return d.isValid()
      ? d.format("ddd, DD MMMM YYYY")
      : DUMMY_DO_DATE;
  }, []);

  const overviewTotals = useMemo(() => {
    return DUMMY_OVERVIEW_ROWS.reduce(
      (acc, row) => ({
        stockAwal: acc.stockAwal + row.stockAwal,
        stockAkhirSystem: acc.stockAkhirSystem + row.stockAkhirSystem,
        stockFisik: acc.stockFisik + row.stockFisik,
        metaStock: acc.metaStock + row.metaStock,
        sohMeta: acc.sohMeta + row.sohMeta,
        variance: acc.variance + row.variance,
      }),
      {
        stockAwal: 0,
        stockAkhirSystem: 0,
        stockFisik: 0,
        metaStock: 0,
        sohMeta: 0,
        variance: 0,
      },
    );
  }, []);

  const handleExport = () => {
    // Placeholder — wiring Excel menyusul saat API ready
    window.alert("Export Excel (dummy) — akan dihubungkan ke API.");
  };

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
            Kelola dan tinjau performa barang secara real-time.
          </p>
          <div className="mt-3 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
            Hari/tgl DO:{" "}
            <span className="ml-1 font-semibold text-slate-800">
              {doDateLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <FaArrowLeft size={12} /> Kembali
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Stock Awal
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {formatQty(DUMMY_SUMMARY.stockAwal)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Total unit awal hari</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Incoming (Terima)
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {formatSignedQty(DUMMY_SUMMARY.totalIncoming)}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <FaArrowUp className="text-emerald-500" size={10} />
            {DUMMY_SUMMARY.incomingTxnCount} transaksi penerimaan
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Outgoing (Keluar)
          </p>
          <p className="mt-2 text-2xl font-bold text-rose-600">
            {formatSignedQty(-Math.abs(DUMMY_SUMMARY.totalOutgoing))}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <FaArrowDown className="text-rose-500" size={10} />
            {DUMMY_SUMMARY.outgoingTxnCount} transaksi pengiriman
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Variance (Selisih Fisik)
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-600">
            {formatSignedQty(DUMMY_SUMMARY.variance)}
          </p>
          <p className="mt-1 text-xs text-slate-500">Requires reconciliation</p>
        </div>
      </div>

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
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <FaFileExcel size={14} /> Export ke Excel
        </button>
      </div>

      {/* Tab panels */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {activeTab === "overview" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Kode Material</th>
                  <th className="px-4 py-3">Material Name</th>
                  <th className="px-4 py-3 text-right">Stock Awal</th>
                  <th className="px-4 py-3 text-right">Stock Akhir (System)</th>
                  <th className="px-4 py-3 text-right">Stock Fisik</th>
                  <th className="px-4 py-3 text-right">Meta Stock</th>
                  <th className="px-4 py-3 text-right">SOH (Meta)</th>
                  <th className="px-4 py-3 text-center">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DUMMY_OVERVIEW_ROWS.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.materialCode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.materialName}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatQty(row.stockAwal)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatQty(row.stockAkhirSystem)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatQty(row.stockFisik)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatQty(row.metaStock)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {formatQty(row.sohMeta)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <VarianceBadge value={row.variance} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-orange-500 text-white">
                  <td
                    colSpan={2}
                    className="px-4 py-3 text-xs font-bold uppercase tracking-wide"
                  >
                    Total All (Pack)
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatQty(overviewTotals.stockAwal)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatQty(overviewTotals.stockAkhirSystem)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatQty(overviewTotals.stockFisik)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatQty(overviewTotals.metaStock)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">
                    {formatQty(overviewTotals.sohMeta)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-rose-700/90 px-2.5 py-0.5 text-xs font-bold text-white">
                      {formatSignedQty(overviewTotals.variance)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {activeTab === "incoming" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Doc Number</th>
                  <th className="px-4 py-3">Kode Material</th>
                  <th className="px-4 py-3">Material Name</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">UOM</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DUMMY_INCOMING_ROWS.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-blue-700">
                      {row.docNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.materialCode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.materialName}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-600">
                      +{formatQty(row.qty)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.uom}</td>
                    <td className="px-4 py-3 text-slate-600">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
              Data dummy Incoming — akan diganti response API.
            </p>
          </div>
        )}

        {activeTab === "outgoing" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Doc Number</th>
                  <th className="px-4 py-3">Kode Material</th>
                  <th className="px-4 py-3">Material Name</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">UOM</th>
                  <th className="px-4 py-3">Destination</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DUMMY_OUTGOING_ROWS.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-blue-700">
                      {row.docNumber}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {row.materialCode}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.materialName}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-rose-600">
                      -{formatQty(row.qty)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{row.uom}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.destination}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
              Data dummy Outgoing — akan diganti response API.
            </p>
          </div>
        )}

        {activeTab === "validation" && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-semibold text-slate-700">
              Stock Validation
            </p>
            <p className="mt-2 text-xs text-slate-400">
              Placeholder tab — form/validasi fisik akan ditambahkan setelah
              kontrak API tersedia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LaporanHarianStock;
