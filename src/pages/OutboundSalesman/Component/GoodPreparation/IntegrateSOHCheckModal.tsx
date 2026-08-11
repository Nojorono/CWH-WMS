import React, { useMemo, useEffect, useState } from "react";
import {
  FaEdit,
  FaExclamationTriangle,
  FaTimes,
  FaCheckCircle,
  FaSpinner,
  FaBoxOpen,
  FaArrowRight,
} from "react-icons/fa";
import Swal from "sweetalert2";

export type SohCheckLine = {
  id: string;
  callplanId: string;
  spbNumber: string;
  salesName: string;
  sku: string;
  itemName: string;
  qtySuggestion: number;
  qtySpb: number;
  soh: number;
  status: "AVAILABLE" | "LESS_STOCK" | "NO_STOCK" | "NOT_NEEDED";
};

type IntegrateSOHCheckModalProps = {
  isOpen: boolean;
  /** Mode global: cek semua SPB sekaligus */
  mode?: "global" | "single";
  spbCount?: number;
  callplanNumber?: string;
  salesName?: string;
  lines: SohCheckLine[];
  isSohLoading?: boolean;
  onClose: () => void;
  onAdjust: () => void;
  onProceed: () => void;
};

// UI Helpers for Badges
const statusBadge = (status: SohCheckLine["status"]) => {
  if (status === "AVAILABLE") {
    return {
      label: "Available",
      badgeClass:
        "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
      rowClass: "hover:bg-slate-50/50 transition-colors duration-200",
    };
  }
  if (status === "NOT_NEEDED") {
    return {
      label: "Tidak Dibutuhkan",
      badgeClass:
        "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/20",
      rowClass: "hover:bg-slate-50/50 transition-colors duration-200",
    };
  }
  if (status === "LESS_STOCK") {
    return {
      label: "Less Stock",
      badgeClass:
        "bg-amber-500 text-white ring-2 ring-amber-600/40 shadow-sm",
      rowClass:
        "bg-amber-100 hover:bg-amber-200/80 border-l-4 border-l-amber-500 font-medium transition-colors duration-200",
    };
  }
  if (status === "NO_STOCK") {
    return {
      label: "No Stock",
      badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
      rowClass:
        "bg-rose-50/30 hover:bg-rose-50/60 transition-colors duration-200",
    };
  }
  return {
    label: "Available",
    badgeClass:
      "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
    rowClass: "hover:bg-slate-50/50 transition-colors duration-200",
  };
};

export default function IntegrateSOHCheckModal({
  isOpen,
  mode = "single",
  spbCount = 1,
  callplanNumber,
  salesName,
  lines,
  isSohLoading,
  onClose,
  onAdjust,
  onProceed,
}: IntegrateSOHCheckModalProps) {
  // Setup modal animation state
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  // LESS_STOCK → wajib adjust; Integrate diblok
  const lessStockLines = useMemo(
    () => lines.filter((l) => l.status === "LESS_STOCK"),
    [lines],
  );
  const hasLessStock = lessStockLines.length > 0;

  const isGlobal = mode === "global";
  const lessStockSpbLabels = useMemo(() => {
    const labels = [
      ...new Set(
        lessStockLines.map((l) => l.spbNumber).filter(Boolean),
      ),
    ];
    return labels.join(", ");
  }, [lessStockLines]);

  // No Stock & Less Stock selalu di baris atas; group by SPB di global mode
  const sortedLines = useMemo(() => {
    const priority = (s: SohCheckLine["status"]) => {
      if (s === "NO_STOCK") return 0;
      if (s === "LESS_STOCK") return 1;
      if (s === "AVAILABLE") return 2;
      return 3; // NOT_NEEDED
    };
    return [...lines].sort((a, b) => {
      const p = priority(a.status) - priority(b.status);
      if (p !== 0) return p;
      if (isGlobal) {
        const spbCmp = a.spbNumber.localeCompare(b.spbNumber);
        if (spbCmp !== 0) return spbCmp;
      }
      const selisihA = a.soh - a.qtySpb;
      const selisihB = b.soh - b.qtySpb;
      if (selisihA !== selisihB) return selisihA - selisihB;
      return a.itemName.localeCompare(b.itemName);
    });
  }, [lines, isGlobal]);

  const handleProceedClick = async () => {
    // Guard: ada LESS_STOCK → jangan lanjut
    if (hasLessStock) return;

    const spbLabel = isGlobal
      ? `Semua SPB (${spbCount})`
      : callplanNumber || "SPB ini";
    const confirm = await Swal.fire({
      title: "Konfirmasi Integrasi?",
      html: isGlobal
        ? `Apakah benar akan dilakukan <strong>Integrate Meta</strong> untuk <strong>${spbCount} SPB</strong>?`
        : `Apakah benar akan dilakukan <strong>Integrate Meta</strong> untuk SPB<br/><strong>${spbLabel}</strong>${
            salesName ? ` (${salesName})` : ""
          }?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Lanjutkan",
      cancelButtonText: "Tidak",
      confirmButtonColor: "#059669",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = "100000";
      },
    });

    // Tidak → stay di modal cek integrasi
    if (!confirm.isConfirmed) return;
    onProceed();
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-[15000] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0"
      }`}
    >
      <div 
        className={`flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5 transition-transform duration-300 ${
          show ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
        }`}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              {isGlobal
                ? "Validasi SOH vs Qty SPB (Semua SPB)"
                : "Validasi SOH vs QTY SPB"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
              {isGlobal ? (
                <>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                    {spbCount} SPB FINAL
                  </span>
                  {callplanNumber && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>Dipicu dari: {callplanNumber}</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                    {callplanNumber || "No Callplan"}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>{salesName || "Unknown Sales"}</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Dynamic Status Banner */}
        <div className="px-6 pt-5 pb-2">
          {isSohLoading ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
              <FaSpinner className="animate-spin text-slate-400" size={16} />
              <p className="text-sm font-medium text-slate-600">
                Memuat data Stock On Hand secara real-time...
              </p>
            </div>
          ) : hasLessStock ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
              <div className="mt-0.5 rounded-full bg-amber-100 p-1">
                <FaExclamationTriangle className="text-amber-600" size={14} />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-amber-900">
                  {isGlobal
                    ? "Integrate Meta diblokir untuk semua SPB"
                    : "Integrate Meta tidak bisa dilanjutkan"}
                </p>
                <p className="text-xs font-medium text-amber-800">
                  {lessStockLines.length} item Less Stock — Qty SPB melebihi SOH.
                  {isGlobal && lessStockSpbLabels && (
                    <>
                      {" "}
                      SPB terdampak:{" "}
                      <span className="font-bold">{lessStockSpbLabels}</span>
                    </>
                  )}
                </p>
                <p className="text-xs font-medium text-amber-700/80">
                  Sesuaikan Qty SPB pada SPB terkait agar tidak melebihi SOH,
                  lalu coba Integrate lagi.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200/60 bg-emerald-50 px-4 py-3 shadow-sm">
              <div className="mt-0.5 rounded-full bg-emerald-100 p-1">
                <FaCheckCircle className="text-emerald-600" size={14} />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-emerald-900">
                  {isGlobal
                    ? "Semua SPB siap Integrate Meta"
                    : "Tidak ada SKU Less Stock"}
                </p>
                <p className="mt-0.5 text-xs font-medium text-emerald-700/80">
                  Qty SPB vs SOH sudah sesuai untuk seluruh item.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto px-6 py-4">
          <div className="overflow-hidden rounded-xl border border-slate-200/60 ring-1 ring-slate-900/5">
            <table className="w-full text-left whitespace-nowrap text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    No
                  </th>
                  {isGlobal && (
                    <th className="px-4 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                      SPB
                    </th>
                  )}
                  <th className="px-4 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Qty Suggestion
                  </th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Qty SPB
                  </th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    SOH
                  </th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Selisih
                  </th>
                  <th className="px-4 py-3 text-center text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedLines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isGlobal ? 9 : 8}
                      className="px-4 py-16 text-center text-sm text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="rounded-full bg-slate-50 p-4">
                          <FaBoxOpen size={24} className="text-slate-300" />
                        </div>
                        <p>Tidak ada item pada SPB</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedLines.map((line, idx) => {
                    const badge = statusBadge(line.status);
                    const selisih = line.soh - line.qtySpb;

                    return (
                      <tr key={`${line.callplanId}-${line.id}`} className={`group ${badge.rowClass}`}>
                        <td className="px-4 py-3.5 text-center font-medium text-slate-400 group-hover:text-slate-500">
                          {idx + 1}
                        </td>
                        {isGlobal && (
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-slate-800">
                              {line.spbNumber}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {line.salesName}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3.5 font-medium text-slate-900">
                          {line.itemName}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                          {line.sku}
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm font-semibold text-slate-600">
                          {line.qtySuggestion}
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm font-semibold text-slate-700">
                          {line.qtySpb}
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm font-semibold text-indigo-600">
                          {line.soh}
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm font-bold">
                          <span className={selisih < 0 ? "text-rose-600" : "text-emerald-600"}>
                            {selisih > 0 ? `+${selisih}` : selisih}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${badge.badgeClass}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions — selalu 3 tombol */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
          >
            Kembali
          </button>

          <button
            type="button"
            onClick={onAdjust}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <FaEdit size={14} />
            Adjust Qty SPB
          </button>

          <button
            type="button"
            onClick={handleProceedClick}
            disabled={isSohLoading || hasLessStock}
            title={
              hasLessStock
                ? "Ada SKU Less Stock — wajib Adjust Qty dulu"
                : undefined
            }
            className="group inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            Lanjut Integrate Meta
            <FaArrowRight
              size={12}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </button>
        </div>
      </div>
    </div>
  );
}