import React from "react";
import { FaFileExcel } from "react-icons/fa";
import type { LhsApiDetailData } from "../../../../../API/services/outbound-salesman/LhsReportService";
import { LhsStockComputed } from "../types";
import { showErrorToast } from "../../../../../components/toast";

type Props = {
  rows: LhsStockComputed[];
  detail: LhsApiDetailData | null;
  amoName: string;
  reportDateLabel: string;
  disabled?: boolean;
  /** Optional: re-fetch detail sebelum export */
  fetchDetail?: () => Promise<LhsApiDetailData | null>;
};

/**
 * Tombol export Excel LSH Summary + LSH Detail.
 * xlsx-js-style di-load dinamis saat klik (hindari freeze saat mount halaman).
 */
function ExportLhsExcelButton({
  rows,
  detail,
  amoName,
  reportDateLabel,
  disabled,
  fetchDetail,
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
        let detailPayload = detail;
        if ((!detailPayload?.rows?.length || fetchDetail) && fetchDetail) {
          detailPayload = await fetchDetail();
        }
        if (!detailPayload?.rows?.length && !detailPayload?.item_codes?.length) {
          showErrorToast("Data detail LSH belum tersedia");
          return;
        }
        const { exportLhsDetailExcel } = await import("../exportLhsDetailExcel");
        exportLhsDetailExcel({
          detail: detailPayload,
          rows,
          amoName,
          reportDateLabel,
        });
      }
    } catch (err) {
      console.error("Export LSH Excel gagal:", err);
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
        {exporting === "summary" ? "Menyiapkan…" : "LSH Summary"}
      </button>
      <button
        type="button"
        disabled={noData || exporting !== null}
        onClick={() => void runExport("detail")}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaFileExcel size={14} />
        {exporting === "detail" ? "Menyiapkan…" : "LSH Detail"}
      </button>
    </div>
  );
}

export default ExportLhsExcelButton;
