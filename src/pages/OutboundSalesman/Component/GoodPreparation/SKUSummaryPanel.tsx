import dayjs from "dayjs";
import React, { useMemo, useState } from "react";
import { FaRotate } from "react-icons/fa6";

export type SkuSummaryFilter = "ALL" | "AVAILABLE" | "LESS_STOCK" | "NO_STOCK";

interface SKUSummaryPanelProps {
  summary: any[];
  onSearchChange: (val: string) => void;
  filter?: SkuSummaryFilter;
  onFilterChange?: (filter: SkuSummaryFilter) => void;
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

const formatStockAt = (raw: string | null | undefined) => {
  if (!raw) return null;
  const parsed = dayjs(raw);
  if (!parsed.isValid()) return String(raw);
  return parsed.format("DD MMM YYYY HH:mm");
};

export const SKUSummaryPanel = ({
  summary,
  onSearchChange,
  filter: filterProp,
  onFilterChange,
}: SKUSummaryPanelProps) => {
  const [internalFilter, setInternalFilter] =
    useState<SkuSummaryFilter>("AVAILABLE");
  const filter = filterProp ?? internalFilter;

  const setFilter = (next: SkuSummaryFilter) => {
    if (onFilterChange) onFilterChange(next);
    else setInternalFilter(next);
  };
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
      </div>

      <div className="pb-2">
        <div className="custom-scrollbar grid max-h-[28rem] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredData.map((item) => {
            const config = getItemCardConfig(item);

            return (
              <div
                key={item.sku}
                onClick={() => handleCardClick(item.sku)}
                className={`cursor-pointer rounded-xl border p-3.5 shadow-sm transition-all duration-200 hover:shadow-md ${config.cardClass}`}
              >
                <div className="mb-2.5 min-w-0">
                  <p className="truncate text-base font-extrabold tracking-wide text-slate-800 uppercase">
                    {item.sku}
                  </p>
                  <p
                    className={`mt-0.5 line-clamp-2 text-xs leading-snug ${config.descriptionClass}`}
                  >
                    {config.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-slate-200/80 pt-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold tracking-wider text-orange-500 uppercase">
                      Stock Awal
                    </p>
                    <p className="text-xl font-extrabold leading-tight text-slate-900 tabular-nums">
                      {Number(item.stockAwal ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-500">
                      {formatStockAt(item.stockAwalAt) || "-"}
                    </p>
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                      Stock Real Time
                    </p>
                    <p className="text-xl font-extrabold leading-tight text-slate-900 tabular-nums">
                      {Number(item.soh ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-500">
                      {formatStockAt(item.sohAt) || "-"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                      Remaining Stock
                    </p>
                    <p
                      className={`text-xl font-extrabold leading-tight tabular-nums ${
                        Number(item.soh ?? 0) - Number(item.totalRequest ?? 0) <
                        0
                          ? "text-red-600"
                          : "text-slate-900"
                      }`}
                    >
                      {(
                        Number(item.soh ?? 0) - Number(item.totalRequest ?? 0)
                      ).toLocaleString()}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] leading-tight text-slate-500">
                      {formatStockAt(item.sohAt) || "-"}
                    </p>
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                      Total Qty SPB
                    </p>
                    <p className="text-xl font-extrabold leading-tight text-slate-900 tabular-nums">
                      {Number(item.totalRequest ?? 0).toLocaleString()}
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

