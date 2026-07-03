import dayjs from "dayjs";
import React, { useState, useMemo } from "react";
import { FaRotate } from "react-icons/fa6";
import { formatDateTimeIndo } from "../../../../helper/FormatDateTime";

interface SKUSummaryPanelProps {
  summary: any[];
  onSearchChange: (val: string) => void;
}

// Fungsi helper diletakkan di luar definisi komponen utama
const getItemCardConfig = (item: any) => {
  const isRegistered = !!(
    item.item_description &&
    item.item_description !== "null" &&
    item.item_description !== "undefined"
  );

  // Kasus 1: Item belum terdaftar
  if (!isRegistered) {
    return {
      isRegistered: false,
      cardClass: "bg-slate-50 border-slate-300 border-dashed",
      label: "Not Registered",
      colorClass: "bg-slate-100 text-slate-700",
      description: "⚠️ Belum Terdaftar di Master Item",
      descriptionClass: "text-red-500 font-bold",
      showDate: false, // Hapus tanggal untuk item tidak terdaftar
    };
  }

  const isNoStock = item.soh <= 0;
  const isAvailable = !isNoStock && item.soh >= item.totalRequest;

  // Kasus 2: NO STOCK
  if (isNoStock) {
    return {
      isRegistered: true,
      cardClass: "bg-red-50/50 border-red-200",
      label: "No Stock",
      colorClass: "bg-red-100 text-red-700",
      description: item.item_description,
      descriptionClass: "text-slate-800 font-semibold",
      showDate: false, // <-- Hapus tanggal jika NO STOCK
    };
  }

  // Kasus 3: AVAILABLE
  if (isAvailable) {
    return {
      isRegistered: true,
      cardClass: "bg-emerald-50 border-emerald-200",
      label: "Available",
      colorClass: "bg-white text-emerald-500",
      description: item.item_description,
      descriptionClass: "text-slate-800 font-semibold",
      showDate: true, // Tampilkan tanggal
    };
  }

  // Kasus 4: LESS STOCK
  return {
    isRegistered: true,
    cardClass: "bg-amber-50/50 border-amber-200",
    label: "Less Stock",
    colorClass: "bg-amber-100 text-amber-700",
    description: item.item_description,
    descriptionClass: "text-slate-800 font-semibold",
    showDate: true, // Tampilkan tanggal
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

    if (filter === "LESS_STOCK")
      data = data.filter(
        (s) => s.item_description && s.soh > 0 && s.soh < s.totalRequest,
      );
    else if (filter === "AVAILABLE")
      // Tambahkan kondisi s.soh > 0 agar item dengan SOH=0 & Req=0 tidak masuk ke sini
      data = data.filter(
        (s) => s.item_description && s.soh > 0 && s.soh >= s.totalRequest,
      );
    else if (filter === "NO_STOCK")
      // s.soh <= 0 sudah otomatis mencakup SOH=0 & Req=0
      data = data.filter((s) => s.item_description && s.soh <= 0);

    return data.sort((a, b) => {
      const getPriority = (s: any) => {
        if (!s.item_description || s.item_description === "null") return 3;
        return s.soh <= 0 ? 0 : s.soh < s.totalRequest ? 1 : 2;
      };
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
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${filter === tab
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
            // Panggil config helper
            const config = getItemCardConfig(item);

            return (
              <div
                key={item.sku}
                onClick={() => handleCardClick(item.sku)}
                className={`p-4 w-72 rounded-xl border shadow-sm transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-[1.02] ${config.cardClass}`}
              >
                {/* Header: SKU & Status */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col truncate mr-2 w-full">
                    <span className="text-[14px] uppercase tracking-wider font-bold text-slate-500">
                      {item.sku}
                    </span>

                    {/* Menampilkan deskripsi secara bersih */}
                    <span className={`text-[11px] leading-tight truncate ${config.descriptionClass}`}>
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

                {/* Metrics Section */}
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
