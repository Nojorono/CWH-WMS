import React from "react";
import { FaFileExcel } from "react-icons/fa";
import { Callplan } from "../../../types/CallplanTypes";
import { BTB } from "../../../types/BTBtypes";
import { LhsStockComputed } from "../types";
import { exportLhsExcel } from "../exportLhsExcel";
import { exportLhsDetailExcel } from "../exportLhsDetailExcel";

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={noData}
        onClick={() =>
          exportLhsExcel({
            rows,
            amoName,
            reportDateLabel,
          })
        }
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaFileExcel size={14} /> Export Summary
      </button>
      <button
        type="button"
        disabled={noData}
        onClick={() =>
          exportLhsDetailExcel({
            rows,
            finalCallplans,
            btbList,
            amoName,
            reportDateLabel,
          })
        }
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaFileExcel size={14} /> Export Detail
      </button>
    </div>
  );
}

export default ExportLhsExcelButton;
