import React, { useState } from "react";
import dayjs from "dayjs";
import {
  FaBoxOpen,
  FaChevronDown,
  FaChevronUp,
  FaExclamationCircle,
  FaFileInvoice,
  FaCalendarAlt,
} from "react-icons/fa";

export type BtbWithoutSpbItem = {
  itemCode: string;
  itemName: string;
  inventoryItemId: string;
  qty: number;
  uom: string;
};

export type BtbWithoutSpbSales = {
  salesNik: string;
  salesName: string;
  btbNumber: string;
  btbDate: string | null;
  skuCount: number;
  totalQty: number;
  details: BtbWithoutSpbItem[];
};

type BtbWithoutSpbAlertProps = {
  items: BtbWithoutSpbSales[];
};

const formatBtbDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = dayjs(value);
  if (!parsed.isValid()) return value;
  return parsed.format("DD MMM YYYY");
};

export const BtbWithoutSpbAlert = ({ items }: BtbWithoutSpbAlertProps) => {
  const [expandedNiks, setExpandedNiks] = useState<Record<string, boolean>>({});

  if (!items?.length) return null;

  const allExpanded =
    items.length > 0 && items.every((row) => expandedNiks[row.salesNik]);

  const toggleRow = (salesNik: string) => {
    setExpandedNiks((prev) => ({
      ...prev,
      [salesNik]: !prev[salesNik],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    items.forEach((row) => {
      next[row.salesNik] = true;
    });
    setExpandedNiks(next);
  };

  const collapseAll = () => {
    setExpandedNiks({});
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="bg-slate-50/50 p-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-4 ring-amber-50">
              <FaExclamationCircle size={18} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold tracking-tight text-slate-800">
                Peringatan: BTB Tanpa SPB
                <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  {items.length} Sales
                </span>
              </h2>
              <p className="max-w-2xl text-xs leading-relaxed text-slate-500">
                Daftar sales berikut memiliki stok BTB di cabang, namun{" "}
                <strong className="font-semibold text-slate-700">
                  tidak ada SPB
                </strong>{" "}
                pada tanggal Good Prep ini. Harap perhatikan saat membuat Form
                Retur atau perhitungan sisa BTB. Klik pada masing-masing kartu
                untuk melihat detail item.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accordion List Section */}
      <div className="max-h-[32rem] overflow-y-auto p-4 space-y-3 bg-slate-50/30">
        {items.map((row) => {
          const isExpanded = Boolean(expandedNiks[row.salesNik]);

          return (
            <div
              key={row.salesNik}
              className={`rounded-xl border transition-all duration-200 ${
                isExpanded
                  ? "border-indigo-300 bg-white shadow-md ring-1 ring-indigo-50"
                  : "border-slate-200 bg-white shadow-sm hover:border-indigo-200 hover:shadow-md"
              }`}
            >
              {/* Accordion Trigger */}
              <button
                type="button"
                onClick={() => toggleRow(row.salesNik)}
                className="flex w-full flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 text-left focus:outline-none"
              >
                {/* Left: Sales Info */}
                <div className="flex items-center gap-3 w-full sm:w-1/3 shrink-0">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                      isExpanded
                        ? "bg-indigo-100 text-indigo-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isExpanded ? (
                      <FaChevronUp size={12} />
                    ) : (
                      <FaChevronDown size={12} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {row.salesName || "Nama Tidak Diketahui"}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      NIK: {row.salesNik}
                    </p>
                  </div>
                </div>

                {/* Middle: BTB Info */}
                <div className="flex flex-col gap-1 w-full sm:w-1/3">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <FaFileInvoice className="text-slate-400" size={12} />
                    <span className="font-semibold text-slate-700">
                      {row.btbNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <FaCalendarAlt className="text-slate-400" size={12} />
                    <span>{formatBtbDate(row.btbDate)}</span>
                  </div>
                </div>

                {/* Right: Metrics Badges */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
                  <div className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
                    <FaBoxOpen size={12} className="opacity-70" />
                    {row.skuCount} SKU
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                    Total Qty: {row.totalQty.toLocaleString("id-ID")}
                  </div>
                </div>
              </button>

              {/* Accordion Content (Table) */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-white rounded-b-xl">
                  {row.details.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="px-5 py-3 font-semibold w-24">
                              Kode Item
                            </th>
                            <th className="px-5 py-3 font-semibold">
                              Nama Item
                            </th>
                            <th className="px-5 py-3 text-right font-semibold w-24">
                              Qty
                            </th>
                            <th className="px-5 py-3 text-center font-semibold w-20">
                              UOM
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {row.details.map((detail, idx) => (
                            <tr
                              key={`${row.salesNik}-${detail.itemCode}-${idx}`}
                              className="transition-colors hover:bg-slate-50/80"
                            >
                              <td className="px-5 py-3 font-medium text-slate-700">
                                {detail.itemCode || "-"}
                              </td>
                              <td className="px-5 py-3 text-slate-600 whitespace-normal min-w-[200px]">
                                {detail.itemName || "-"}
                              </td>
                              <td className="px-5 py-3 text-right font-bold text-slate-800">
                                {Number(detail.qty || 0).toLocaleString(
                                  "id-ID",
                                )}
                              </td>
                              <td className="px-5 py-3 text-center text-slate-500 font-medium">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                                  {detail.uom || "BKS"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <p className="text-xs text-slate-400">
                        Tidak ada detail item yang tersedia untuk BTB ini.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
