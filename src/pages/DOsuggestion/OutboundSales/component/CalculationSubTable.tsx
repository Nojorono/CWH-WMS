import React from "react";

// Komponen helper (bisa juga ditaruh di file terpisah jika dipakai di banyak tempat)
const HighlightText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  if (!highlight.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-200 text-slate-900 rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </span>
  );
};

// utils/statusConfig.ts
export const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  AVAILABLE: {
    label: "Available",
    class: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  PRO_RATA: {
    label: "Pro Rata",
    class: "text-blue-600 bg-blue-50 border-blue-200",
  },
  LESS_STOCK: {
    label: "Less Stock",
    class: "text-amber-600 bg-amber-50 border-amber-200",
  },
  NO_STOCK: {
    label: "No Stock",
    class: "text-red-600 bg-red-50 border-red-200",
  },
  EMPTY: {
    label: "Empty",
    class: "text-red-600 bg-red-50 border-red-200",
  },
};

export const CalculationSubTable = ({
  details,
  globalFilter,
}: {
  details: any[];
  globalFilter?: string;
}) => {
  const sortedDetails = React.useMemo(() => {
    if (!globalFilter) return details;
    return [...details].sort((a, b) => {
      const aMatch = a.item_code
        ?.toLowerCase()
        .includes(globalFilter.toLowerCase());
      const bMatch = b.item_code
        ?.toLowerCase()
        .includes(globalFilter.toLowerCase());
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });
  }, [details, globalFilter]);

  return (
    <div className="p-4 bg-slate-50/50">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase">
              <tr>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3 text-right">Stock on Hand</th>
                <th className="px-5 py-3 text-right">Request</th>
                <th className="px-5 py-3 text-right">Contrib %</th>
                <th className="px-5 py-3 text-right">Status</th>
                <th className="px-5 py-3 text-right">Final Qty</th>
                <th className="px-5 py-3 text-right">BTB Qty</th>
                <th className="px-5 py-3 text-right">Prepared Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDetails.map((item, idx) => {
                const highlighted =
                  globalFilter &&
                  item.item_code
                    ?.toLowerCase()
                    .includes(globalFilter.toLowerCase());

                const status = STATUS_CONFIG[item.allocation_status] || {
                  label: item.allocation_status,
                  class: "text-slate-600 bg-slate-50 border-slate-200",
                };

                return (
                  <tr
                    key={idx}
                    className={`transition-colors duration-300 ${highlighted ? "bg-yellow-100/60 hover:bg-yellow-100" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-5 py-3 font-medium text-slate-700">
                      <HighlightText
                        text={item.item_code}
                        highlight={globalFilter || ""}
                      />
                    </td>
                    <td className="px-5 py-3 text-right">{item.soh}</td>
                    <td className="px-5 py-3 text-right">
                      {item.item_qty_submitted}
                    </td>
                    <td className="px-5 py-3 text-right text-blue-600 font-semibold">
                      {item.contribution_percentage}%
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`px-2 py-1 rounded border text-[10px] font-semibold ${status.class}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">
                      {item.item_qty_final}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">
                      {item.qty_btb}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-800">
                      {item.prepared_qty}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
