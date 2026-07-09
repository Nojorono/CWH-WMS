import React, { useEffect, useMemo } from "react";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";

// Interface yang fleksibel agar bisa menerima data flat BTB maupun data DO
interface BTBItemData {
  PRODUCT_SKU?: string;
  item_code?: string;
  QTY_BTB?: string | number;
  qty_btb?: string | number;
}

interface BTBTotalBreakdownProps {
  data: BTBItemData[]; // Array data yang mengandung SKU dan QTY BTB
  title?: string; // Judul opsional (default: "Breakdown Total BTB")
}

const BTBTotalBreakdown = ({
  data,
  title = "Breakdown Total BTB",
}: BTBTotalBreakdownProps) => {
  const { fetchAll, list: itemList } = useStoreItem();

  console.log("DATA BTB", data);


  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Proses Grouping & Penjumlahan (Sum) menggunakan useMemo
  const breakdownList = useMemo(() => {
    const summaryMap: Record<string, number> = {};

    // 1. Looping data dan jumlahkan QTY berdasarkan SKU
    data.forEach((item) => {
      // Handle perbedaan penamaan key dari API berbeda
      const sku = item.PRODUCT_SKU || item.item_code;
      const qty = Number(item.QTY_BTB || item.qty_btb) || 0;

      if (!sku) return;

      if (summaryMap[sku]) {
        summaryMap[sku] += qty;
      } else {
        summaryMap[sku] = qty;
      }
    });

    // 2. Ubah object map kembali menjadi array, lalu cari nama itemnya
    return (
      Object.keys(summaryMap)
        .map((sku) => {
          const matchedItem = itemList?.find(
            (master: any) => master.sku === sku,
          );
          const itemName = matchedItem ? matchedItem.description : sku;

          return {
            sku,
            itemName,
            totalQty: summaryMap[sku],
          };
        })
        // 3. Filter item yang quantity-nya 0 (jika ada) dan urutkan A-Z
        .filter((item) => item.totalQty > 0)
        .sort((a, b) => a.itemName.localeCompare(b.itemName))
    );
  }, [data, itemList]);

  if (!breakdownList.length) return null;

  // Kalkulasi Grand Total semua barang
  const grandTotal = breakdownList.reduce(
    (acc, curr) => acc + curr.totalQty,
    0,
  );

  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 shadow-sm w-full mb-4">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-200/60 pb-3 mb-3 gap-2">
        <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2 uppercase tracking-wide">
          <svg
            className="w-4 h-4 text-indigo-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {title}
        </h3>

        {/* Badge Grand Total */}
        <div className="flex items-center gap-2">
          <div className="bg-white border border-indigo-200 text-indigo-700 px-4 py-1.5 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-indigo-900">
              {grandTotal} BKS
            </span>
            <span className="text-sm font-medium text-indigo-500 ml-2 uppercase">
              dari {breakdownList.length} SKU
            </span>
          </div>
        </div>
      </div>

      {/* Grid Breakdown Item */}
      {/* Menggunakan grid rapat agar muat banyak item */}
      <div className="max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {breakdownList.map((item, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-white border border-indigo-100 p-2 rounded-md hover:border-indigo-300 transition-colors"
            >
              <div className="flex flex-col overflow-hidden pr-2">
                <span
                  className="text-xs font-bold text-slate-700 truncate"
                  title={item.itemName}
                >
                  {item.itemName}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {item.sku}
                </span>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-2 border-l border-indigo-50">
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {item.totalQty}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BTBTotalBreakdown;
