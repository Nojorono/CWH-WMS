import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState, useMemo } from "react";
import Button from "../../../../../../components/ui/button/Button";
import { FormValues } from "../formTypes";
import { formatDateIndo } from "../../../../../../helper/FormatDate";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: FormValues;
  inbAddToReceiveNo?: any;
}

export default function InboundConfirmModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  inbAddToReceiveNo,
}: ConfirmationModalProps) {
  const [expandedDO, setExpandedDO] = useState<string | null>(null);

  // ✅ OPTIMASI 1: Bungkus kalkulasi berat dengan useMemo
  const { totalDO, totalSKU, globalUomTotals, skuSummary } = useMemo(() => {
    if (!formData?.deliveryOrders) {
      return { totalDO: 0, totalSKU: 0, globalUomTotals: {}, skuSummary: {} };
    }

    const totalDO = formData.deliveryOrders.length;
    let totalSKU = 0;
    const uomTotals: Record<string, number> = {};

    const summary: Record<
      string,
      {
        item_number: string;
        item_name: string;
        qty: number;
        breakdown: { do_no: string; po_no: string; qty: number; uom: string }[];
      }
    > = {};

    formData.deliveryOrders.forEach((do_) => {
      do_.pos?.forEach((po) => {
        po.items?.forEach((item) => {
          totalSKU += 1;
          const itemId = item.item_id ?? "unknown_id";
          const uom = item.uom ?? "-";
          const qty = typeof item.qty === "number" ? item.qty : 0;
          const item_number = item.item_number ?? "-";
          const item_name = item.item_name ?? "Unknown SKU";

          // Hitung global UOM
          uomTotals[uom] = (uomTotals[uom] || 0) + qty;

          // Grouping berdasarkan gabungan ID & UOM agar tidak bentrok
          const groupKey = `${itemId}_${uom}`;

          if (!summary[groupKey]) {
            summary[groupKey] = {
              item_number,
              item_name,
              qty: 0,
              breakdown: [],
            };
          }

          summary[groupKey].qty += qty;
          summary[groupKey].breakdown.push({
            do_no: do_.do_no,
            po_no: po.po_no ?? "-",
            qty,
            uom,
          });
        });
      });
    });

    return {
      totalDO,
      totalSKU,
      globalUomTotals: uomTotals,
      skuSummary: summary,
    };
  }, [formData]);

  const totalQuantityString = useMemo(() => {
    return (
      Object.entries(globalUomTotals)
        .map(([uom, qty]) => `${qty} ${uom}`)
        .join(", ") || "0"
    );
  }, [globalUomTotals]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="bg-white rounded-2xl shadow-2xl max-w-[60vw] w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 text-center shrink-0">
              <DialogTitle className="text-2xl font-semibold text-gray-800">
                {inbAddToReceiveNo
                  ? "Confirmation Add to Receive Inbound"
                  : "Confirmation Inbound Plan"}
              </DialogTitle>
            </div>

            <div className="px-6 py-6 space-y-8 overflow-y-auto grow">
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  {inbAddToReceiveNo
                    ? "Add to Receive Inbound"
                    : "Inbound Planning Details"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Inbound Planning No.
                    </label>
                    <input
                      type="text"
                      value={formData.inbound_plan_no}
                      disabled
                      className="w-full rounded-md border-gray-300 bg-gray-200 text-gray-700 text-sm px-3 py-2 focus:outline-none"
                    />
                  </div>

                  {inbAddToReceiveNo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Receipt No
                      </label>
                      <input
                        type="text"
                        value={inbAddToReceiveNo}
                        disabled
                        className="w-full rounded-md border-gray-300 bg-blue-50 text-blue-700 font-bold font-mono text-sm px-3 py-2 focus:outline-none border"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Plat Nomor
                    </label>
                    <input
                      type="text"
                      value={formData.no_pol}
                      disabled
                      className="w-full rounded-md border-gray-300 bg-gray-100 text-gray-700 text-sm px-3 py-2 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Ekspedisi
                    </label>
                    <input
                      type="text"
                      value={
                        typeof formData.expedition === "object"
                          ? formData.expedition?.label || ""
                          : formData.expedition || ""
                      }
                      disabled
                      className="w-full rounded-md border-gray-300 bg-gray-100 text-gray-700 text-sm px-3 py-2 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Driver
                    </label>
                    <input
                      type="text"
                      value={formData.driver}
                      disabled
                      className="w-full rounded-md border-gray-300 bg-gray-100 text-gray-700 text-sm px-3 py-2 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      No. Telp Driver
                    </label>
                    <input
                      type="text"
                      value={formData.driver_phone}
                      disabled
                      className="w-full rounded-md border-gray-300 bg-gray-100 text-gray-700 text-sm px-3 py-2 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Tanggal Kedatangan
                    </label>
                    <input
                      type="text"
                      value={formatDateIndo(formData.arrival_date ?? null)}
                      disabled
                      className="w-full rounded-md border-gray-300 bg-gray-100 text-gray-700 text-sm px-3 py-2 focus:outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Section 2: Summary */}
              <section className="bg-slate-50 border rounded-xl p-5">
                <div className="flex flex-col items-center justify-start mb-4">
                  <h2 className="text-lg font-semibold text-gray-700 mb-2">
                    Nomor Polisi &nbsp;
                    <span className="inline-block px-2 py-1 rounded bg-orange-500 text-white font-semibold">
                      {formData.no_pol}
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-6 text-center mb-6">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-gray-900">
                      {totalDO}
                    </p>
                    <p className="text-xs text-gray-500">Surat Jalan</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-gray-900">
                      {totalSKU}
                    </p>
                    <p className="text-xs text-gray-500">Total SKU</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <p className="text-2xl font-bold text-gray-900">
                      {totalQuantityString}
                    </p>
                    <p className="text-xs text-gray-500">Total Quantity</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 sticky top-0 bg-white">
                    Summary per SKU
                  </h3>

                  {/* Scrollable container */}
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    <div className="space-y-3">
                      {Object.entries(skuSummary).map(
                        ([key, { item_number, item_name, qty, breakdown }]) => (
                          <div
                            key={key}
                            className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="flex justify-between items-start mb-2 bg-green-200 p-2 rounded-md">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {item_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Item No: {item_number}
                                </p>
                              </div>
                              <div className="text-right bg-green-100 text-green-800 px-2 py-1 rounded-md text-md font-semibold">
                                Total Qty: {qty}
                              </div>
                            </div>

                            <div className="border-t border-gray-200 mt-3 pt-2">
                              <p className="text-xs font-semibold text-gray-600 mb-2">
                                Source:
                              </p>

                              <div className="overflow-x-auto">
                                <table className="min-w-full text-xs border border-gray-100 rounded-md">
                                  <thead className="bg-gray-100 text-gray-700 font-semibold">
                                    <tr>
                                      <th className="px-3 py-2 text-left border-b border-gray-200">
                                        No. SJ
                                      </th>
                                      <th className="px-3 py-2 text-left border-b border-gray-200">
                                        No. PO
                                      </th>
                                      <th className="px-3 py-2 text-right border-b border-gray-200">
                                        Qty
                                      </th>
                                      <th className="px-3 py-2 text-right border-b border-gray-200">
                                        UoM
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {breakdown.map((b, idx) => (
                                      <tr
                                        key={idx}
                                        className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                                      >
                                        <td className="px-3 py-2 text-gray-800">
                                          {b.do_no}
                                        </td>
                                        <td className="px-3 py-2 text-gray-800">
                                          {b.po_no}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                          {b.qty}
                                        </td>
                                        <td className="px-3 py-2 text-right text-gray-800">
                                          {b.uom}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Footer Buttons */}
            <div className="bg-white border-t px-6 py-4 flex justify-end gap-3 shrink-0">
              <Button type="button" variant="danger" onClick={onClose}>
                Back
              </Button>
              <Button type="button" variant="secondary" onClick={onSubmit}>
                Submit
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
