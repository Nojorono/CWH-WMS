import React from "react";
import dayjs from "dayjs";
import { FaBoxOpen, FaUserSlash } from "react-icons/fa";

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
  if (!items.length) return null;

  return (
    <div className="w-full rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-white to-sky-50 px-4 py-3 shadow-sm ring-1 ring-sky-100">
      <div className="flex flex-wrap items-start gap-3">
        <div className="mt-0.5 rounded-full bg-sky-100 p-2 text-sky-700">
          <FaUserSlash size={13} />
        </div>
        <div className="min-w-[220px] flex-1 space-y-3">
          <div>
            <p className="text-xs font-bold tracking-wide text-sky-900 uppercase">
              BTB tanpa SPB ({items.length} sales)
            </p>
            <p className="mt-0.5 text-xs text-sky-800">
              Sales berikut punya stok BTB di cabang, tetapi tidak ada SPB pada
              tanggal Good Prep ini. Perhatikan saat Form Retur / perhitungan
              sisa BTB.
            </p>
          </div>

          <div className="space-y-3">
            {items.map((row) => (
              <div
                key={row.salesNik}
                className="overflow-hidden rounded-xl border border-sky-200 bg-white shadow-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 bg-sky-50/70 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-sky-900">
                      {row.salesName || "-"}
                    </p>
                    <p className="text-[10px] text-sky-700">
                      NIK: {row.salesNik} · BTB: {row.btbNumber}
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-sky-700">
                    <p>
                      <span className="font-semibold text-sky-900">Tgl BTB:</span>{" "}
                      {formatBtbDate(row.btbDate)}
                    </p>
                    <p className="mt-0.5 inline-flex items-center gap-1">
                      <FaBoxOpen size={9} />
                      {row.skuCount} SKU · qty{" "}
                      {row.totalQty.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                {row.details.length > 0 ? (
                  <div className="max-h-40 overflow-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead className="sticky top-0 bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-3 py-1.5 font-semibold">SKU</th>
                          <th className="px-3 py-1.5 font-semibold">Item</th>
                          <th className="px-3 py-1.5 text-right font-semibold">
                            Qty
                          </th>
                          <th className="px-3 py-1.5 text-center font-semibold">
                            UOM
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {row.details.map((detail, idx) => (
                          <tr
                            key={`${row.salesNik}-${detail.itemCode}-${idx}`}
                            className="hover:bg-sky-50/40"
                          >
                            <td className="px-3 py-1.5 font-semibold text-slate-800">
                              {detail.itemCode || "-"}
                            </td>
                            <td
                              className="max-w-[220px] truncate px-3 py-1.5 text-slate-600"
                              title={detail.itemName}
                            >
                              {detail.itemName || "-"}
                            </td>
                            <td className="px-3 py-1.5 text-right font-bold text-sky-800">
                              {Number(detail.qty || 0).toLocaleString("id-ID")}
                            </td>
                            <td className="px-3 py-1.5 text-center text-slate-500">
                              {detail.uom || "BKS"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-3 py-3 text-center text-[10px] italic text-slate-400">
                    Tidak ada detail item BTB
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
