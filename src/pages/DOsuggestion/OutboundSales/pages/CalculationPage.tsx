import React, { useState, useMemo } from "react";
import { BaseTable } from "../component/BaseTable";
import Button from "../../../../components/ui/button/Button";
import { FaArrowRight, FaCalculator } from "react-icons/fa";
import { GroupedSPBData } from "../MainTable";
import { useGetStockOnHand } from "../hook/useGetStockOnHand";
import { FaRecycle } from "react-icons/fa6";

interface CalculationPageProps {
  data: GroupedSPBData[];
  onProceed: () => void;
}

// Fungsi pembantu untuk konsistensi SKU key
const resolveSku = (item: any) =>
  (item.item_code && item.item_code !== "null" ? item.item_code : null) ||
  item.item_number ||
  String(item.inventory_item_id || "");

// 1. HELICOPTER VIEW PANEL
const SKUSummaryPanel = ({ summary }: { summary: any[] }) => {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    // 1. Bersihkan data (Hapus null/undefined)
    let data = summary.filter(
      (s) => s.sku && s.sku !== "null" && s.sku !== "undefined",
    );

    // 2. Filter Search
    if (search) {
      data = data.filter((s) =>
        s.sku.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // 3. Filter Tab (Menggunakan istilah baru)
    if (filter === "LESS_STOCK")
      data = data.filter((s) => s.soh > 0 && s.soh < s.totalRequest);
    else if (filter === "AVAILABLE")
      data = data.filter((s) => s.soh >= s.totalRequest);
    else if (filter === "NO_STOCK") data = data.filter((s) => s.soh <= 0);

    // 4. Sort: Prioritas yang butuh perhatian di depan
    // Urutan: NO_STOCK -> LESS_STOCK -> AVAILABLE
    return data.sort((a, b) => {
      const getPriority = (s: any) =>
        s.soh <= 0 ? 0 : s.soh < s.totalRequest ? 1 : 2;
      return getPriority(a) - getPriority(b);
    });
  }, [summary, filter, search]);

  return (
    <div className="mb-6 space-y-4">
      {/* Search & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <input
          type="text"
          placeholder="Cari SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 w-full sm:w-64"
        />

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

      {/* Grid Container */}
      <div className="overflow-x-auto pb-4">
        <div className="grid grid-rows-3 grid-flow-col gap-3 w-max">
          {filteredData.map((item) => {
            const isAvailable = item.soh >= item.totalRequest;
            const isLessStock = item.soh > 0 && item.soh < item.totalRequest;

            // Tentukan status untuk label
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
                className={`p-3 w-64 rounded-lg border shadow-sm ${isAvailable ? "bg-emerald-50 border-slate-200" : isLessStock ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-800 text-sm truncate mr-2">
                    {item.sku}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colorClass}`}
                  >
                    {label}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>SOH</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {item.soh}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Total Req</span>{" "}
                  <span className="font-semibold text-slate-800">
                    {item.totalRequest}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 2. SUB-TABLE
const CalculationSubTable = ({ details }: { details: any[] }) => (
  <div className="p-4 bg-slate-50/50">
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-slate-500 font-medium text-xs">
          <tr>
            <th className="px-5 py-3">SKU</th>
            <th className="px-5 py-3 text-right">SOH</th>
            <th className="px-5 py-3 text-right">Request</th>
            <th className="px-5 py-3 text-right">Contrib %</th>
            <th className="px-5 py-3 text-right">Status</th>
            <th className="px-5 py-3 text-right">Final Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {details.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50">
              <td className="px-5 py-3 font-medium text-slate-700">
                {item.resolved_sku}
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
                  className={`px-2 py-1 rounded border text-[10px] font-semibold ${
                    item.allocation_status === "AVAILABLE_STOCK"
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : item.allocation_status === "PRO_RATA"
                        ? "text-blue-600 bg-blue-50 border-blue-200"
                        : item.allocation_status === "NO_STOCK" ||
                            item.allocation_status === "EMPTY"
                          ? "text-red-600 bg-red-50 border-red-200"
                          : "text-amber-600 bg-amber-50 border-amber-200" // Fallback untuk status lain
                  }`}
                >
                  {item.allocation_status}
                </span>
              </td>
              <td className="px-5 py-3 text-right font-bold text-slate-800">
                {item.item_qty_final}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// 3. MAIN COMPONENT
export const CalculationPage = ({ data, onProceed }: CalculationPageProps) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);

  const { data: stockList, isLoading: isStockLoading } = useGetStockOnHand({
    org: "KRW",
    sub: "KECIL",
    date: "2026-06-02",
  });

  const flatSalesmanList = useMemo(
    () => data.flatMap((g) => g.salesmenDO),
    [data],
  );
  const safeParse = (val: any) => parseFloat(val) || 0;

  const { calculatedData, skuSummary } = useMemo(() => {
    if (!stockList || !Array.isArray(stockList))
      return { calculatedData: [], skuSummary: [] };

    const sohMap = stockList.reduce(
      (acc, item) => {
        const key = resolveSku(item);
        if (key) acc[key] = (acc[key] || 0) + (item.quantity || 0);
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalSubmittedPerSku = flatSalesmanList
      .flatMap((d) => d.details)
      .reduce(
        (acc, curr) => {
          const key = resolveSku(curr);
          acc[key] = (acc[key] || 0) + safeParse(curr.item_qty_submitted);
          return acc;
        },
        {} as Record<string, number>,
      );

    const uniqueSkus = Array.from(
      new Set([...Object.keys(sohMap), ...Object.keys(totalSubmittedPerSku)]),
    );
    const summary = uniqueSkus.map((sku) => ({
      sku,
      soh: sohMap[sku] || 0,
      totalRequest: totalSubmittedPerSku[sku] || 0,
    }));

    const calculatedData = flatSalesmanList.map((salesman) => ({
      ...salesman,
      details: salesman.details
        .filter((detail) => resolveSku(detail))
        .map((detail: any) => {
          const key = resolveSku(detail);
          const submitted = safeParse(detail.item_qty_submitted);
          const totalReq = totalSubmittedPerSku[key] || 0;
          const soh = sohMap[key] || 0;

          // 1. KONTRIBUSI SELALU BERDASARKAN PORSI PERMINTAAN (AKURAT)
          // Ini tidak akan pernah di-override ke 1.0, jadi Admin selalu tahu porsi asli sales.
          const contribution = totalReq > 0 ? submitted / totalReq : 0;

          let finalQty = 0;
          let status = "NORMAL";

          // 2. LOGIKA ALOKASI BERDASARKAN SOH
          if (soh <= 0) {
            finalQty = 0;
            status = "NO_STOCK";
          } else if (soh >= totalReq) {
            // Stok cukup: Penuhi permintaan asli
            finalQty = submitted;
            status = "AVAILABLE_STOCK";
          } else {
            // Stok kurang: Bagi rata berdasarkan porsi permintaan
            finalQty = Math.round(contribution * soh);
            status = "PRO_RATA";
          }

          return {
            ...detail,
            resolved_sku: key,
            soh,
            contribution_percentage:
              soh <= 0 ? "0" : (contribution * 100).toFixed(2),
            allocation_status: status,
            item_qty_final: finalQty,
            // // Kebutuhan prep dihitung dari selisih Final Qty dengan BTB
            // need_to_prepare: Math.max(0, finalQty - safeParse(detail.qty_btb)),
          };
        }),
    }));

    return { calculatedData, skuSummary: summary };
  }, [flatSalesmanList, stockList]);

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      setIsCalculated(true);
    }, 2000); // Simulasi 2 detik proses
  };

  return (
    <div className="p-6">
      <SKUSummaryPanel summary={skuSummary} />

      {/* Tampilan Trigger Calculation */}
      {!isCalculated && !isCalculating && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-white shadow-sm">
          <div className="text-slate-400 mb-4 text-4xl">
            <FaCalculator />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-1">
            Ready to Calculate?
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            Click the button below to process stock allocation for all SPBs.
          </p>
          <Button
            onClick={handleCalculate}
            variant="primary"
            endIcon={<FaArrowRight />}
          >
            Calculate Stock Allocation
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isCalculating && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">
            Processing allocation logic...
          </p>
        </div>
      )}

      {/* Main Table (Muncul Setelah Trigger) */}
      {isCalculated && (
        <div className="space-y-4 animate-in fade-in duration-500">
          {/* Tombol Re-calculate diletakkan di sini */}
          <div className="flex justify-end">
            <Button
              onClick={() => setIsCalculated(false)} // Reset state untuk trigger ulang
              variant="outline"
              className="text-xs"
              startIcon={<FaRecycle />}
            >
              Re-calculate
            </Button>
          </div>

          <BaseTable
            data={calculatedData}
            columns={[
              { accessorKey: "spb_number", header: "SPB Number" },
              { accessorKey: "sales_name", header: "Nama Sales" },
              {
                id: "total_sku",
                header: "Total SKU",
                cell: ({ row }) => row.original.details?.length || 0,
              },
            ]}
            isExpandable={true}
            renderSubComponent={(row) => (
              <CalculationSubTable details={row.details} />
            )}
            footerAction={
              <Button
                onClick={onProceed}
                variant="primary"
                endIcon={<FaArrowRight />}
              >
                Proceed to Goods Preparation
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
};
