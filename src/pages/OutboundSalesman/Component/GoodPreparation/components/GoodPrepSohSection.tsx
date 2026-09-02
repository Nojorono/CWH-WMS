import React, { useRef, useState } from "react";
import { IntegrateBlockAlert } from "../IntegrateBlockAlert";
import {
  SKUSummaryPanel,
  SkuSummaryFilter,
} from "../SKUSummaryPanel";

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

const STATUS_BADGES: {
  filter: SkuSummaryFilter;
  label: string;
  countKey: keyof GoodPrepSohSectionProps["sohStatusCount"];
  activeClass: string;
  idleClass: string;
}[] = [
  {
    filter: "AVAILABLE",
    label: "SKU Available",
    countKey: "available",
    activeClass:
      "border-emerald-500 bg-emerald-100 text-emerald-800 ring-2 ring-emerald-200",
    idleClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  {
    filter: "LESS_STOCK",
    label: "SKU Less Stock",
    countKey: "less",
    activeClass:
      "border-amber-500 bg-amber-100 text-amber-800 ring-2 ring-amber-200",
    idleClass:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  {
    filter: "NO_STOCK",
    label: "SKU No Stock",
    countKey: "noStock",
    activeClass: "border-red-500 bg-red-100 text-red-800 ring-2 ring-red-200",
    idleClass: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
];

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
  const [skuFilter, setSkuFilter] = useState<SkuSummaryFilter>("AVAILABLE");
  const skuPanelRef = useRef<HTMLDivElement>(null);

  const handleBadgeClick = (filter: SkuSummaryFilter) => {
    setSkuFilter(filter);
    skuPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  };

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
            <span className="font-semibold text-slate-700">
              {sohFetchedAtLabel}
            </span>
          </p>
        </div>

        {isSohLoading && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
            Memuat SOH...
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
        {STATUS_BADGES.map((badge) => {
          const isActive = skuFilter === badge.filter;

          return (
            <button
              key={badge.filter}
              type="button"
              onClick={() => handleBadgeClick(badge.filter)}
              className={`cursor-pointer rounded-full border px-3 py-1 transition-all ${
                isActive ? badge.activeClass : badge.idleClass
              }`}
            >
              {badge.label}: {sohStatusCount[badge.countKey]}
            </button>
          );
        })}
      </div>

      <div ref={skuPanelRef}>
        <SKUSummaryPanel
          summary={skuSummary}
          onSearchChange={onSearchChange}
          filter={skuFilter}
          onFilterChange={setSkuFilter}
        />
      </div>

      {globalHasLessStock && (
        <IntegrateBlockAlert
          spbNumbers={branchLessStockSpbList}
          onSelectSpb={onSelectSpb}
        />
      )}
    </div>
  );
};
