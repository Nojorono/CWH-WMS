import React from "react";
import dayjs from "dayjs";
import BTBTotalBreakdown from "../../../../DOsuggestion/OutboundSales/component/BTBTotalBreakdown";
import { EnrichedCallplan } from "../types";
import { PrepDetailTable } from "../PrepDetailTable";
import { AdjustQtyItem } from "../AdjustQtySPB";

type GoodPrepExpandedRowProps = {
  row: EnrichedCallplan;
  globalFilter: string;
  isAdjustDisabled?: boolean;
  onSaveAdjustments: (
    callplanId: string,
    payload: {
      items: AdjustQtyItem[];
      approvalUrl: string | null;
    },
  ) => Promise<boolean>;
};

export const GoodPrepExpandedRow = ({
  row,
  globalFilter,
  isAdjustDisabled = false,
  onSaveAdjustments,
}: GoodPrepExpandedRowProps) => {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50/50 p-2">
      {(row.btbNumber || row.btbDate) && (
        <div className="flex flex-wrap items-center gap-6 rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              No. BTB:
            </span>
            <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
              {row.btbNumber || "Tidak Diketahui"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tanggal BTB:
            </span>
            <span className="text-xs font-bold text-slate-800">
              {row.btbDate ? dayjs(row.btbDate).format("DD MMMM YYYY") : "-"}
            </span>
          </div>
        </div>
      )}

      <BTBTotalBreakdown
        title={`Total Seluruh BTB - ${row.sales_name}`}
        data={row.rawBTBDetails || []}
      />

      <PrepDetailTable
        callplanId={row.id}
        details={row.details || []}
        unmatchedDetails={row.unmatchedBTBDetails || []}
        isAdjustDisabled={isAdjustDisabled}
        onSaveAdjustments={onSaveAdjustments}
        highlightedSku={globalFilter}
        header={{
          callplanNumber: row.callplan_number || row.spb_number,
          salesName: row.sales_name,
          salesNik: row.sales_nik,
          spvName: row.sales_spv,
          spvNik: row.sales_spv_nik,
          status: row.status,
        }}
      />
    </div>
  );
};
