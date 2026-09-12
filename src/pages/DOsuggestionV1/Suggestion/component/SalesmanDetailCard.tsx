import React from "react";
import {
  MdArrowBack,
  MdAssignment,
  MdMap,
  MdCalendarToday,
  MdLayers,
  MdFormatListBulleted,
} from "react-icons/md";

interface SalesmanDetailCardProps {
  salesData: any;
  status?: string;
  onBack: () => void;
  totalSku?: number;
  totalQty?: number;
}

export default function SalesmanDetailCard({
  salesData,
  status,
  onBack,
  totalSku,
  totalQty
}: SalesmanDetailCardProps) {
  const isSubmitted = status === "SUBMITTED";

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
      {/* SECTION 1: TOP HEADER (Salesman & Status) */}
      <div className="p-6 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 hover:text-slate-900 border border-transparent"
          >
            <MdArrowBack size={22} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Salesman
            </h1>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {salesData?.SALES_NAME || "Sales"}
              <span className="text-slate-400 font-medium text-lg ml-2">
                ({salesData?.SALES_NIK || "-"})
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Document Status
          </span>
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold border ${isSubmitted
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isSubmitted ? "bg-emerald-500" : "bg-amber-500"
                }`}
            />
            {status || "DRAFT"}
          </div>
        </div>
      </div>

      {/* SECTION 2: BOTTOM DETAILS (Callplan Info) */}
      <div className="p-6">
        <h2 className="font-semibold text-slate-800 mb-5">
          Callplan Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-5 gap-x-6 text-sm">
          <DetailRow
            icon={<MdAssignment size={16} />}
            label="Callplan Number"
            value={salesData?.CALL_PLAN_NUMBER || "-"}
          />
          <DetailRow
            icon={<MdCalendarToday size={15} />}
            label="Callplan Start Date"
            value={salesData?.CALL_PLAN_START_DATE || "-"}
          />
          <DetailRow
            icon={<MdLayers size={16} />}
            label="Total SKU"
            value={totalSku !== undefined ? `${totalSku}` : "-"}
          />
          <DetailRow
            icon={<MdMap size={16} />}
            label="Trip Type"
            value={salesData?.trip_type || "-"}
          />
          <DetailRow
            icon={<MdCalendarToday size={15} />}
            label="Callplan End Date"
            value={salesData?.CALL_PLAN_END_DATE || "-"}
          />
          <DetailRow
            icon={<MdFormatListBulleted size={16} />}
            label="Total Qty SPB"
            value={totalQty !== undefined ? `${totalQty.toLocaleString("id-ID")} BKS` : "-"}
          />
          <DetailRow
            icon={<MdAssignment size={16} />}
            label="Route Number"
            value={salesData?.ROUTE_NUMBER || "-"}
          />
        </div>
      </div>
    </div>
  );
}

// Komponen pembantu untuk Row (Bisa dibiarkan di file yang sama)
function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 text-slate-700">
      <span className="text-slate-400">{icon}</span>
      <span className="text-slate-500 w-32">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
