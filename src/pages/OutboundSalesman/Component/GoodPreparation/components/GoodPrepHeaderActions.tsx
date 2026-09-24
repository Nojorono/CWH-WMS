import React from "react";
import { FaFileAlt } from "react-icons/fa";

type GoodPrepHeaderActionsProps = {
  isPrintDisabled: boolean;
  /** Ada baris Form Permintaan (FPPR Awal) */
  hasPermintaanData?: boolean;
  /** Ada baris Form Permintaan DO Manual (FPPR Tambahan) */
  hasPermintaanDoManualData?: boolean;
  /** Ada baris Form Retur */
  hasReturData?: boolean;
  /** Ada baris Form Tambahan */
  hasTambahanData?: boolean;
  onExportSummary: () => void;
  onOpenPermintaan: () => void;
  onOpenPermintaanDoManual: () => void;
  onOpenRetur: () => void;
  onOpenTambahan: () => void;
};

export const GoodPrepHeaderActions = ({
  isPrintDisabled,
  hasPermintaanData = true,
  hasPermintaanDoManualData = true,
  hasReturData = true,
  hasTambahanData = true,
  onOpenPermintaan,
  onOpenPermintaanDoManual,
  onOpenRetur,
  onOpenTambahan,
}: GoodPrepHeaderActionsProps) => {
  const isPermintaanDisabled = isPrintDisabled || !hasPermintaanData;
  const isPermintaanDoManualDisabled =
    isPrintDisabled || !hasPermintaanDoManualData;
  const isReturDisabled = isPrintDisabled || !hasReturData;
  const isTambahanDisabled = isPrintDisabled || !hasTambahanData;

  return (
    <div className="flex w-full min-w-full flex-1 items-center gap-4">
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenPermintaan}
          disabled={isPermintaanDisabled}
          title={
            isPrintDisabled
              ? "Dikunci — data BTB cabang belum tersedia"
              : !hasPermintaanData
                ? "Tidak ada data Form Permintaan (FPPR Awal)"
                : undefined
          }
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isPermintaanDisabled
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FaFileAlt /> Form Permintaan Gudang (FPPR Awal)
        </button>

        <button
          type="button"
          onClick={onOpenPermintaanDoManual}
          disabled={isPermintaanDoManualDisabled}
          title={
            isPrintDisabled
              ? "Dikunci — data BTB cabang belum tersedia"
              : !hasPermintaanDoManualData
                ? "Tidak ada data Form Permintaan DO Manual (FPPR Tambahan)"
                : undefined
          }
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isPermintaanDoManualDisabled
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "border border-indigo-300 bg-white text-indigo-600 hover:bg-indigo-50"
          }`}
        >
          <FaFileAlt /> Form Permintaan DO Manual (FPPR Tambahan)
        </button>

        <button
          type="button"
          onClick={onOpenRetur}
          disabled={isReturDisabled}
          title={
            isPrintDisabled
              ? "Dikunci — data BTB cabang belum tersedia"
              : !hasReturData
                ? "Tidak ada data Form Retur"
                : undefined
          }
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isReturDisabled
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "border border-red-300 bg-white text-red-600 hover:bg-red-50"
          }`}
        >
          <FaFileAlt /> Form Retur
        </button>

        <button
          type="button"
          onClick={onOpenTambahan}
          disabled={isTambahanDisabled}
          title={
            isPrintDisabled
              ? "Dikunci — data BTB cabang belum tersedia"
              : !hasTambahanData
                ? "Tidak ada data Form Tambahan"
                : undefined
          }
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isTambahanDisabled
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "border border-emerald-300 bg-white text-emerald-600 hover:bg-emerald-50"
          }`}
        >
          <FaFileAlt /> Form Tambahan
        </button>
      </div>
    </div>
  );
};
