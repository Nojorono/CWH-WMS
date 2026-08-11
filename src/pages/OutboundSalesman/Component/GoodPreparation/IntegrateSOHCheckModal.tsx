import React, { useMemo, useEffect, useState } from "react";
import { 
  FaEdit, 
  FaExclamationTriangle, 
  FaTimes, 
  FaCheckCircle, 
  FaSpinner, 
  FaBoxOpen,
  FaArrowRight
} from "react-icons/fa";

export type SohCheckLine = {
  id: string;
  sku: string;
  itemName: string;
  qtySpb: number;
  soh: number;
  status: "AVAILABLE" | "LESS_STOCK" | "NO_STOCK";
};

type IntegrateSOHCheckModalProps = {
  isOpen: boolean;
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
      badgeClass: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
      rowClass: "hover:bg-slate-50/50 transition-colors duration-200",
    };
  }
  if (status === "LESS_STOCK") {
    return {
      label: "Less Stock",
      badgeClass: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20",
      rowClass: "bg-amber-50/30 hover:bg-amber-50/60 transition-colors duration-200",
    };
  }
  return {
    label: "No Stock",
    badgeClass: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20",
    rowClass: "bg-rose-50/30 hover:bg-rose-50/60 transition-colors duration-200",
  };
};

export default function IntegrateSOHCheckModal({
  isOpen,
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

  const issueCount = useMemo(
    () => lines.filter((l) => l.status !== "AVAILABLE").length,
    [lines]
  );
  const hasIssue = issueCount > 0;

  const sortedLines = useMemo(() => {
    const priority = (s: SohCheckLine["status"]) =>
      s === "NO_STOCK" ? 0 : s === "LESS_STOCK" ? 1 : 2;
    return [...lines].sort((a, b) => {
      const p = priority(a.status) - priority(b.status);
      if (p !== 0) return p;
      return a.itemName.localeCompare(b.itemName);
    });
  }, [lines]);

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
              Validasi SOH vs QTY SPB
            </h2>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                {callplanNumber || "No Callplan"}
              </span>
              <span className="text-slate-300">•</span>
              <span>{salesName || "Unknown Sales"}</span>
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
          ) : hasIssue ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200/60 bg-amber-50 px-4 py-3 shadow-sm">
              <div className="mt-0.5 rounded-full bg-amber-100 p-1">
                <FaExclamationTriangle className="text-amber-600" size={14} />
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-amber-900">
                  Ditemukan {issueCount} SKU yang melebihi atau tidak tersedia di SOH
                </p>
                <p className="mt-0.5 text-xs font-medium text-amber-700/80">
                  Harap sesuaikan kuantitas SPB (Adjust Qty) terlebih dahulu sebelum melanjutkan integrasi ke Meta.
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
                  Semua SKU Tersedia
                </p>
                <p className="mt-0.5 text-xs font-medium text-emerald-700/80">
                  Kuantitas SPB tervalidasi dengan Stock On Hand. Siap untuk proses selanjutnya.
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
                  <th className="px-4 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                    SKU
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
                      colSpan={7}
                      className="px-4 py-16 text-center text-sm text-slate-400"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="rounded-full bg-slate-50 p-4">
                          <FaBoxOpen size={24} className="text-slate-300" />
                        </div>
                        <p>Tidak ada item pada SPB ini</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedLines.map((line, idx) => {
                    const badge = statusBadge(line.status);
                    const selisih = line.soh - line.qtySpb;
                    
                    return (
                      <tr key={line.id} className={`group ${badge.rowClass}`}>
                        <td className="px-4 py-3.5 text-center font-medium text-slate-400 group-hover:text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-900">
                          {line.itemName}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                          {line.sku}
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

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-1"
          >
            Kembali
          </button>
          
          {hasIssue ? (
            <button
              type="button"
              onClick={onAdjust}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              <FaEdit size={14} /> 
              Adjust Qty SPB
            </button>
          ) : (
            <button
              type="button"
              onClick={onProceed}
              disabled={isSohLoading || sortedLines.length === 0}
              className="group inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              Lanjut Integrate Meta
              <FaArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}