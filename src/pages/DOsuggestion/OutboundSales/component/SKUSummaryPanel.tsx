import React, { useState, useMemo } from "react";
import { FaTrash } from "react-icons/fa";
import { FaRotate } from "react-icons/fa6";

interface SKUSummaryPanelProps {
  summary: any[];
  onSearchChange: (val: string) => void;
}

export const SKUSummaryPanel = ({
  summary,
  onSearchChange,
}: SKUSummaryPanelProps) => {
  const [filter, setFilter] = useState("AVAILABLE");
  const [search, setSearch] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onSearchChange(val);
  };

  console.log("summary", summary);

  const filteredData = useMemo(() => {
    let data = summary.filter(
      (s) => s.sku && s.sku !== "null" && s.sku !== "undefined",
    );

    if (search) {
      data = data.filter((s) =>
        s.sku.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (filter === "LESS_STOCK")
      data = data.filter((s) => s.soh > 0 && s.soh < s.totalRequest);
    else if (filter === "AVAILABLE")
      data = data.filter((s) => s.soh >= s.totalRequest);
    else if (filter === "NO_STOCK") data = data.filter((s) => s.soh <= 0);

    return data.sort((a, b) => {
      const getPriority = (s: any) =>
        s.soh <= 0 ? 0 : s.soh < s.totalRequest ? 1 : 2;
      return getPriority(a) - getPriority(b);
    });
  }, [summary, filter, search]);

  const handleCardClick = (sku: string) => {
    setSearch(sku); // Update input di panel
    onSearchChange(sku); // Trigger filter di parent (BaseTable)
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari SKU..."
            value={search}
            onChange={handleInputChange}
            className="w-full px-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                onSearchChange("");
              }}
              className="absolute right-3 top-2 text-slate-400 hover:text-red-500"
            >
              <FaRotate />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {["ALL", "AVAILABLE", "LESS_STOCK", "NO_STOCK"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                filter === tab
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="flex flex-wrap gap-3 max-h-70 overflow-y-auto pr-2 custom-scrollbar">
          {filteredData.map((item) => {
            const isAvailable = item.soh >= item.totalRequest;
            const isLessStock = item.soh > 0 && item.soh < item.totalRequest;

            const label = isAvailable
              ? "Available"
              : isLessStock
                ? "Less Stock"
                : "No Stock";
            const colorClass = isAvailable
              ? "bg-white text-emerald-500"
              : isLessStock
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700";

            return (
              <div
                key={item.sku}
                onClick={() => handleCardClick(item.sku)}
                className={`p-4 w-72 rounded-xl border shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.02] ${
                  isAvailable
                    ? "bg-emerald-50 border-emerald-200"
                    : isLessStock
                      ? "bg-amber-50/50 border-amber-200"
                      : "bg-red-50/50 border-red-200"
                }`}
              >
                {/* Header: SKU & Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col truncate mr-2">
                    <span className="text-[14px] uppercase tracking-wider font-bold text-slate-500">
                      {item.sku}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-800leading-tight">
                      {item.item_description}
                    </span>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                      isAvailable
                        ? "text-emerald-600 bg-white border-emerald-200"
                        : isLessStock
                          ? "text-amber-700 bg-amber-100 border-amber-200"
                          : "text-red-600 bg-red-100 border-red-200"
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {/* Metrics Section: Menggunakan Grid agar sejajar rapi */}
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                      Stock on Hand
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {item.soh.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                      Total Req
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {item.totalRequest.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
