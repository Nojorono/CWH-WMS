import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { FaRotate } from "react-icons/fa6";
import { formatDateTimeIndo } from "../../../../helper/FormatDateTime";

interface SKUSummaryPanelProps {
  summary: any[];
  onSearchChange: (val: string) => void;
}

/** Status kartu: SPB > SOH → Less Stock; SPB === 0 & SOH === 0 → No Stock */
const getStockStatus = (item: {
  soh?: number;
  totalRequest?: number;
}): "NO_STOCK" | "LESS_STOCK" | "AVAILABLE" => {
  const soh = Number(item.soh) || 0;
  const spb = Number(item.totalRequest) || 0;
  if (soh === 0 && spb === 0) return "NO_STOCK";
  if (spb > soh) return "LESS_STOCK";
  return "AVAILABLE";
};

const getItemCardConfig = (item: any) => {
  const isRegistered = !!(
    item.item_description &&
    item.item_description !== "null" &&
    item.item_description !== "undefined"
  );

  if (!isRegistered) {
    return {
      cardClass: "bg-slate-50 border-slate-300 border-dashed",
      label: "Not Registered",
      colorClass: "bg-slate-100 text-slate-700",
      description: "⚠️ Belum Terdaftar di Master Item",
      descriptionClass: "text-red-500 font-bold",
      showDate: false,
    };
  }

  const stockStatus = getStockStatus(item);

  if (stockStatus === "NO_STOCK") {
    return {
      cardClass: "bg-red-50/50 border-red-200",
      label: "No Stock",
      colorClass: "bg-red-100 text-red-700",
      description: item.item_description,
      descriptionClass: "text-slate-800 font-semibold",
      showDate: false,
    };
  }

  if (stockStatus === "AVAILABLE") {
    return {
      cardClass: "bg-emerald-50 border-emerald-200",
      label: "Available",
      colorClass: "bg-white text-emerald-500",
      description: item.item_description,
      descriptionClass: "text-slate-800 font-semibold",
      showDate: true,
    };
  }

  return {
    cardClass: "bg-amber-50/50 border-amber-200",
    label: "Less Stock",
    colorClass: "bg-amber-100 text-amber-700",
    description: item.item_description,
    descriptionClass: "text-slate-800 font-semibold",
    showDate: true,
  };
};

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

  const filteredData = useMemo(() => {
    let data = summary.filter(
      (s) => s.sku && s.sku !== "null" && s.sku !== "undefined",
    );

    if (search) {
      data = data.filter((s) =>
        s.sku.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (filter === "LESS_STOCK") {
      data = data.filter(
        (s) => s.item_description && getStockStatus(s) === "LESS_STOCK",
      );
    } else if (filter === "AVAILABLE") {
      data = data.filter(
        (s) => s.item_description && getStockStatus(s) === "AVAILABLE",
      );
    } else if (filter === "NO_STOCK") {
      data = data.filter(
        (s) => s.item_description && getStockStatus(s) === "NO_STOCK",
      );
    }

    return data.sort((a, b) => {
      const getPriority = (s: any) => {
        if (!s.item_description || s.item_description === "null") return 3;
        const status = getStockStatus(s);
        if (status === "NO_STOCK") return 0;
        if (status === "LESS_STOCK") return 1;
        return 2;
      };
      return getPriority(a) - getPriority(b);
    });
  }, [summary, filter, search]);

  const handleCardClick = (sku: string) => {
    setSearch(sku);
    onSearchChange(sku);
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari SKU..."
            value={search}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                onSearchChange("");
              }}
              className="absolute top-2 right-3 text-slate-400 hover:text-red-500"
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
              className={`rounded-lg border px-3 py-1.5 text-[10px] font-bold transition-all ${
                filter === tab
                  ? "bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="custom-scrollbar flex max-h-70 flex-wrap gap-3 overflow-y-auto pr-2">
          {filteredData.map((item) => {
            const config = getItemCardConfig(item);

            return (
              <div
                key={item.sku}
                onClick={() => handleCardClick(item.sku)}
                className={`w-72 cursor-pointer rounded-xl border p-4 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${config.cardClass}`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="mr-2 flex w-full flex-col truncate">
                    <span className="text-[14px] font-bold tracking-wider text-slate-500 uppercase">
                      {item.sku}
                    </span>

                    <span
                      className={`truncate text-[11px] leading-tight ${config.descriptionClass}`}
                    >
                      {config.description}
                    </span>

                    {config.showDate && item.createdAt && (
                      <span className="mt-1 text-[10px] text-slate-500">
                        Created at{" "}
                        <span className="font-medium">
                          {formatDateTimeIndo(item.createdAt)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
                      Stock on Hand
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {item.soh.toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] font-medium tracking-wider text-slate-400 uppercase">
                      Total Qty SPB
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

