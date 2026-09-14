import React from "react";
import { FaFileExcel } from "react-icons/fa";
import { Callplan } from "../../../types/CallplanTypes";
import { BTB } from "../../../types/BTBtypes";
import { LhsStockComputed } from "../types";
import { showErrorToast } from "../../../../../components/toast";

type Props = {
  rows: LhsStockComputed[];
  finalCallplans: Callplan[];
  btbList: BTB[];
  amoName: string;
  reportDateLabel: string;
  disabled?: boolean;
};

/**
 * Tombol export Excel LHS Summary + Detail.
 * xlsx-js-style di-load dinamis saat klik (hindari freeze saat mount halaman).
 */
function ExportLhsExcelButton({
  rows,
  finalCallplans,
  btbList,
  amoName,
  reportDateLabel,
  disabled,
}: Props) {
  const noData = disabled || rows.length === 0;
  const [exporting, setExporting] = React.useState<"summary" | "detail" | null>(
    null,
  );

  const runExport = async (kind: "summary" | "detail") => {
    if (noData || exporting) return;
    setExporting(kind);
    try {
      if (kind === "summary") {
        const { exportLhsExcel } = await import("../exportLhsExcel");
        exportLhsExcel({ rows, amoName, reportDateLabel });
      } else {
        const { exportLhsDetailExcel } = await import("../exportLhsDetailExcel");
        exportLhsDetailExcel({
          rows,
          finalCallplans,
          btbList,
          amoName,
          reportDateLabel,
        });
      }
    } catch (err) {
      console.error("Export LHS Excel gagal:", err);
      showErrorToast("Gagal mengekspor Excel");
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={noData || exporting !== null}
        onClick={() => void runExport("summary")}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaFileExcel size={14} />
        {exporting === "summary" ? "Menyiapkan…" : "Export Summary"}
      </button>
      <button
        type="button"
        disabled={noData || exporting !== null}
        onClick={() => void runExport("detail")}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaFileExcel size={14} />
        {exporting === "detail" ? "Menyiapkan…" : "Export Detail"}
      </button>
    </div>
  );
}

export default ExportLhsExcelButton;
