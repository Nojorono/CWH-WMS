import React from "react";
import { FaDownload, FaFileAlt } from "react-icons/fa";

type GoodPrepHeaderActionsProps = {
  isPrintDisabled: boolean;
  onExportSummary: () => void;
  onOpenPermintaan: () => void;
  onOpenRetur: () => void;
  onOpenTambahan: () => void;
};

export const GoodPrepHeaderActions = ({
  isPrintDisabled,
  onExportSummary,
  onOpenPermintaan,
  onOpenRetur,
  onOpenTambahan,
}: GoodPrepHeaderActionsProps) => {
  return (
    <div className="flex w-full min-w-full flex-1 items-center gap-4">
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExportSummary}
          disabled={isPrintDisabled}
          title={
            isPrintDisabled
              ? "Dikunci — data BTB cabang belum tersedia"
              : undefined
          }
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isPrintDisabled
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FaDownload /> Summary
        </button>

        <button
          type="button"
          onClick={onOpenPermintaan}
          disabled={isPrintDisabled}
          title={
            isPrintDisabled
              ? "Dikunci — data BTB cabang belum tersedia"
              : undefined
          }
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isPrintDisabled
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FaFileAlt /> Form Permintaan Gudang
        </button>

        <button
          type="button"
          onClick={onOpenRetur}
          disabled={isPrintDisabled}
          title={
            isPrintDisabled
              ? "Dikunci — data BTB cabang belum tersedia"
              : undefined
          }
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isPrintDisabled
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "border border-red-300 bg-white text-red-600 hover:bg-red-50"
          }`}
        >
          <FaFileAlt /> Form Retur
        </button>

        <button
          type="button"
          onClick={onOpenTambahan}
          disabled={isPrintDisabled}
          title={
            isPrintDisabled
              ? "Dikunci — data BTB cabang belum tersedia"
              : undefined
          }
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isPrintDisabled
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
