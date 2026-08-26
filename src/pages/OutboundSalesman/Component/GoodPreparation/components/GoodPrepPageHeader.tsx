import React from "react";
import { FaArrowLeft } from "react-icons/fa";

type GoodPrepPageHeaderProps = {
  spbCount: number;
  targetDate: string;
  onBack: () => void;
};

export const GoodPrepPageHeader = ({
  spbCount,
  targetDate,
  onBack,
}: GoodPrepPageHeaderProps) => {
  return (
    <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
            Outbound Salesman
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">
            Goods Preparation
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700">
              Total SPB: {spbCount}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
              Callplan Date: {targetDate}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
              BTB sync untuk Print & Top Up
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-orange-400 hover:bg-orange-50 hover:shadow"
        >
          <FaArrowLeft size={12} /> Back to SPB
        </button>
      </div>
    </div>
  );
};
