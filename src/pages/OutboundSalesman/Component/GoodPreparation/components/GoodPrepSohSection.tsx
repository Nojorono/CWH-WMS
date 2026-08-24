import React from "react";
import { IntegrateBlockAlert } from "../IntegrateBlockAlert";
import { SKUSummaryPanel } from "../SKUSummaryPanel";

type SkuSummaryItem = {
  sku: string;
  item_code: string;
  item_description: string;
  createdAt: string | null;
  soh: number;
  totalRequest: number;
};

type GoodPrepSohSectionProps = {
  sohFetchedAtLabel: string;
  isSohLoading: boolean;
  sohStatusCount: { available: number; less: number; noStock: number };
  skuSummary: SkuSummaryItem[];
  globalHasLessStock: boolean;
  branchLessStockSpbList: string[];
  onSearchChange: (value: string) => void;
  onSelectSpb: (spbNumber: string) => void;
};

export const GoodPrepSohSection = ({
  sohFetchedAtLabel,
  isSohLoading,
  sohStatusCount,
  skuSummary,
  globalHasLessStock,
  branchLessStockSpbList,
  onSearchChange,
  onSelectSpb,
}: GoodPrepSohSectionProps) => {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            Section SOH
          </p>
          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-800">
            Stock On Hand Monitoring
          </h2>
          <p className="mt-1 text-[11px] text-slate-500">
            Timestamp SOH:{" "}
            <span className="font-semibold text-slate-700">{sohFetchedAtLabel}</span>
          </p>
        </div>
        {isSohLoading && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
            Memuat SOH...
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
          SKU Available: {sohStatusCount.available}
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
          SKU Less Stock: {sohStatusCount.less}
        </span>
        <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-red-700">
          SKU No Stock: {sohStatusCount.noStock}
        </span>
      </div>

      <SKUSummaryPanel summary={skuSummary} onSearchChange={onSearchChange} />

      {globalHasLessStock && (
        <IntegrateBlockAlert
          spbNumbers={branchLessStockSpbList}
          onSelectSpb={onSelectSpb}
        />
      )}
    </div>
  );
};
