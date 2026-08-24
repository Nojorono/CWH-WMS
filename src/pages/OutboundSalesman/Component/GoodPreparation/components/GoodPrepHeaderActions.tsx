import React from "react";
import { FaDownload, FaFileAlt } from "react-icons/fa";

type GoodPrepHeaderActionsProps = {
  errBTB: string | null;
  isBTBEmpty: boolean;
  btbDateLabel: string;
  isPrintDisabled: boolean;
  returCount: number;
  onExportSummary: () => void;
  onOpenPermintaan: () => void;
  onOpenRetur: () => void;
  onOpenTambahan: () => void;
};

export const GoodPrepHeaderActions = ({
  errBTB,
  isBTBEmpty,
  btbDateLabel,
  isPrintDisabled,
  returCount,
  onExportSummary,
  onOpenPermintaan,
  onOpenRetur,
  onOpenTambahan,
}: GoodPrepHeaderActionsProps) => {
  return (
    <div className="flex w-full min-w-full flex-1 items-center gap-4">
      <div>
        {(errBTB || isBTBEmpty) && (
          <span className="flex w-fit items-center whitespace-nowrap rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 shadow-sm">
            <span className="mr-2">⚠️</span>
            {errBTB
              ? "DWH Error: Data BTB gagal ditarik"
              : `Data BTB tgl ${btbDateLabel} dari DWH masih belum tersedia!`}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onExportSummary}
          disabled={isPrintDisabled}
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
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isPrintDisabled
              ? "cursor-not-allowed bg-slate-200 text-slate-400"
              : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <FaFileAlt /> Permintaan Gudang
        </button>

        <button
          type="button"
          onClick={onOpenRetur}
          disabled={isPrintDisabled || returCount === 0}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isPrintDisabled || returCount === 0
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
