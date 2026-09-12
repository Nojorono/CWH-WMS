import React, { useEffect, useMemo, useState } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useStoreItem } from "../../../../DynamicAPI/stores/Store/MasterStore";

// Interface yang fleksibel agar bisa menerima data flat BTB maupun data DO
interface BTBItemData {
  PRODUCT_SKU?: string;
  item_code?: string;
  QTY_BTB?: string | number;
  qty_btb?: string | number;
  btb_qty?: string | number;
}

interface BTBTotalBreakdownProps {
  data: BTBItemData[]; // Array data yang mengandung SKU dan QTY BTB
  title?: string; // Judul opsional (default: "Breakdown Total BTB")
  /** Default expanded state (default: true) */
  defaultExpanded?: boolean;
}

const BTBTotalBreakdown = ({
  data,
  title = "Breakdown Total BTB",
  defaultExpanded = true,
}: BTBTotalBreakdownProps) => {
  const { fetchAll, list: itemList } = useStoreItem();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

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
      const qty = Number(item.QTY_BTB || item.qty_btb || item.btb_qty) || 0;

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
    <div className="mb-4 w-full rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
      {/* Header Summary — klik untuk expand/collapse */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${
          isExpanded ? "mb-3 border-b border-indigo-200/60 pb-3" : ""
        }`}
        aria-expanded={isExpanded}
      >
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-indigo-900">
          <svg
            className="h-4 w-4 text-indigo-600"
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
          <span className="ml-1 text-indigo-500">
            {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
          </span>
        </h3>

        {/* Badge Grand Total */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-indigo-200 bg-white px-4 py-1.5 text-indigo-700 shadow-sm">
            <span className="text-sm font-medium text-indigo-900">
              {grandTotal} BKS
            </span>
            <span className="ml-2 text-sm font-medium uppercase text-indigo-500">
              dari {breakdownList.length} SKU
            </span>
          </div>
        </div>
      </button>

      {/* Grid Breakdown Item — hanya tampil saat expanded */}
      {isExpanded && (
        <div className="custom-scrollbar max-h-[250px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {breakdownList.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-md border border-indigo-100 bg-white p-2 transition-colors hover:border-indigo-300"
              >
                <div className="flex flex-col overflow-hidden pr-2">
                  <span
                    className="truncate text-xs font-bold text-slate-700"
                    title={item.itemName}
                  >
                    {item.itemName}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">
                    {item.sku}
                  </span>
                </div>

                <div className="flex shrink-0 flex-col items-end border-l border-indigo-50 pl-2">
                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                    {item.totalQty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BTBTotalBreakdown;
