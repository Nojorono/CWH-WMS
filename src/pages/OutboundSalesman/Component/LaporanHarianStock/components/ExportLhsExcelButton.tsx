import React from "react";
import { FaFileExcel } from "react-icons/fa";
import { LhsStockComputed } from "../types";
import { exportLhsExcel } from "../exportLhsExcel";

type Props = {
  rows: LhsStockComputed[];
  amoName: string;
  reportDateLabel: string;
  disabled?: boolean;
};

/**
 * Tombol export Excel LHS (layout template + formula).
 */
function ExportLhsExcelButton({
  rows,
  amoName,
  reportDateLabel,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || rows.length === 0}
      onClick={() =>
        exportLhsExcel({
          rows,
          amoName,
          reportDateLabel,
        })
      }
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <FaFileExcel size={14} /> Export to Excel
    </button>
  );
}

export default ExportLhsExcelButton;
