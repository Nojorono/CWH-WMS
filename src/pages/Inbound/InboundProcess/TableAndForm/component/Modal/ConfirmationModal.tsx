import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import Button from "../../../../../../components/ui/button/Button";
import { FormValues } from "../formTypes";
import React from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import { formatDateIndo } from "../../../../../../helper/FormatDate";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: FormValues;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
}: ConfirmationModalProps) {
  const [expandedDO, setExpandedDO] = useState<string | null>(null);

  if (!isOpen) return null;

  // === summary calculation ===
  const totalDO = formData.deliveryOrders.length;

  const allItems = formData.deliveryOrders.flatMap((do_) =>
    do_.pos.flatMap((po) => po.items)
  );

  const totalQty = allItems.reduce(
    (sum, i) => sum + (typeof i.qty === "number" ? i.qty : 0),
    0
  );

  const skuSummaryWithDifferentUOM = formData.deliveryOrders.reduce(
    (
      acc: Record<
        string,
        { item_number: string; item_name: string; qty: number; uom: string }[]
      >,
      do_
    ) => {
      do_.pos.forEach((po) => {
        po.items.forEach((item) => {
          const key = item.item_id ?? "unknown_id";
          const item_number = item.item_number ?? "-";
          const item_name = item.item_name ?? "Unknown SKU";
          const qty = typeof item.qty === "number" ? item.qty : 0;
          const uom = item.uom ?? "-";

          if (!acc[key]) {
            acc[key] = [];
          }

          const existingEntry = acc[key].find((entry) => entry.uom === uom);
          if (existingEntry) {
            existingEntry.qty += qty;
          } else {
            acc[key].push({ item_number, item_name, qty, uom });
          }
        });
      });

      return acc;
    },
    {}
  );

  console.log("SKU Summary with Different UOM:", skuSummaryWithDifferentUOM);

  const totalSKU = allItems.length;

  // Summary per SKU (pakai item_id, tampilkan item_name, item_number, DO, dan PO breakdown)
  const skuSummary = formData.deliveryOrders.reduce(
    (
      acc: Record<
        string,
        {
          item_number: string;
          item_name: string;
          qty: number;
          breakdown: {
            do_no: string;
            po_no: string;
            qty: number;
            uom: string;
          }[];
        }
      >,
      do_
    ) => {
      do_.pos.forEach((po) => {
        po.items.forEach((item) => {
          const key = item.item_id ?? "unknown_id";
          const item_number = item.item_number ?? "-";
          const item_name = item.item_name ?? "Unknown SKU";
          const qty = typeof item.qty === "number" ? item.qty : 0;
          const uom = item.uom ?? "-";

          // Check if the SKU already exists and has the same UOM
          const existingEntry = acc[key];
          if (existingEntry) {
            const sameUOM = existingEntry.breakdown.some((b) => b.uom === uom);
            if (sameUOM) {
              existingEntry.qty += qty;
              existingEntry.breakdown.push({
                do_no: do_.do_no,
                po_no: po.po_no ?? "-",
                qty,
                uom,
              });
            } else {
              // If UOM is different, create a new entry
              acc[`${key}_${uom}`] = {
                item_number,
                item_name,
                qty,
                breakdown: [
                  { do_no: do_.do_no, po_no: po.po_no ?? "-", qty, uom },
                ],
              };
            }
          } else {
            acc[key] = { item_number, item_name, qty: 0, breakdown: [] };
            acc[key].qty += qty;
            acc[key].breakdown.push({
              do_no: do_.do_no,
              po_no: po.po_no ?? "-",
              qty,
              uom,
            });
          }
        });
      });

      return acc;
    },
    {}
  );

  const toggleExpand = (do_no: string) => {
    setExpandedDO(expandedDO === do_no ? null : do_no);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-[9999]">
      {/* Blur background */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998]"
        aria-hidden="true"
      />
      <div className="flex items-center justify-center min-h-screen p-4 fixed inset-0 z-[9999]">
        <DialogPanel className="bg-white rounded-2xl shadow-2xl max-w-[60vw] w-full max-h-[98vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
            <DialogTitle className="text-2xl font-semibold text-gray-800">
              Confirmation Plan
            </DialogTitle>
          </div>

          <div className="px-6 py-6 space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                Inbound Planning Details
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
                    Expedition
                  </label>
                  <input
                    type="text"
                    value={formData.expedition}
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
                    Asal
                  </label>
                  <input
                    type="text"
                    value={formData.origin}
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
                  <p className="text-2xl font-bold text-gray-900">{totalDO}</p>
                  <p className="text-xs text-gray-500">Surat Jalan</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-gray-900">{totalSKU}</p>
                  <p className="text-xs text-gray-500">Total SKU</p>
                </div>
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.entries(skuSummaryWithDifferentUOM)
                      .map(([, items]) => {
                        const uomSummary = items.reduce((acc, item) => {
                          acc[item.uom] = (acc[item.uom] || 0) + item.qty;
                          return acc;
                        }, {} as Record<string, number>);

                        return Object.entries(uomSummary)
                          .map(([uom, qty]) => `${qty} ${uom}`)
                          .join(", ");
                      })
                      .join(", ")}
                  </p>
                  <p className="text-xs text-gray-500">Total Quantity</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 sticky top-0 bg-white z-10">
                  Summary per SKU
                </h3>

                {/* Scrollable container */}
                <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                  <div className="space-y-3">
                    {Object.entries(skuSummary).map(
                      ([
                        item_id,
                        { item_number, item_name, qty, breakdown },
                      ]) => (
                        <div
                          key={item_id}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                        >
                          {/* Header SKU */}
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

                          {/* Breakdown / Source */}
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
                      )
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: DO Detail Table (Expandable) */}
            {/* <section>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Detail Surat Jalan
              </h2>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-3 py-2 border text-center"></th>
                      <th className="px-3 py-2 border">Nomor Surat Jalan</th>
                      <th className="px-3 py-2 border text-center">Total PO</th>
                      <th className="px-3 py-2 border text-center">
                        Total SKU
                      </th>
                      <th className="px-3 py-2 border text-center">
                        Total Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.deliveryOrders.map((do_) => {
                      const allItems = do_.pos.flatMap((po) => po.items);
                      const totalSKU = allItems.length;
                      const totalQty = allItems.reduce(
                        (sum, i) => sum + (i.qty || 0),
                        0
                      );

                      return (
                        <React.Fragment key={do_.do_no}>
                          <tr
                            className="bg-white hover:bg-slate-50 transition"
                            onClick={() => toggleExpand(do_.do_no)}
                          >
                            <td className="px-3 py-2 border text-center">
                              <button
                                onClick={() => toggleExpand(do_.do_no)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                {expandedDO === do_.do_no ? (
                                  <FaChevronDown />
                                ) : (
                                  <FaChevronRight />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2 border">{do_.do_no}</td>
                            <td className="px-3 py-2 border text-center">
                              {do_.pos.length}
                            </td>
                            <td className="px-3 py-2 border text-center">
                              {totalSKU}
                            </td>
                            <td className="px-3 py-2 border text-center">
                              {totalQty}
                            </td>
                          </tr>

                          {expandedDO === do_.do_no && (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-3 py-3 bg-slate-50 border-t"
                              >
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs border-collapse">
                                    <thead className="bg-slate-200 text-gray-700">
                                      <tr>
                                        <th className="px-2 py-1 border">
                                          PO No
                                        </th>
                                        <th className="px-2 py-1 border">
                                          SKU
                                        </th>
                                        <th className="px-2 py-1 border">
                                          Item Name
                                        </th>
                                        <th className="px-2 py-1 border text-right">
                                          Qty
                                        </th>
                                        <th className="px-2 py-1 border">
                                          UoM
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {do_.pos.map((po) =>
                                        po.items.map((item, idx) => (
                                          <tr
                                            key={`${po.po_no}-${idx}`}
                                            className="odd:bg-white even:bg-slate-50"
                                          >
                                            <td className="px-2 py-1 border">
                                              {po.po_no}
                                            </td>
                                            <td className="px-2 py-1 border">
                                              {item.sku}
                                            </td>
                                            <td className="px-2 py-1 border">
                                              {item.description}
                                            </td>
                                            <td className="px-2 py-1 border text-right">
                                              {item.qty}
                                            </td>
                                            <td className="px-2 py-1 border">
                                              {item.uom}
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section> */}
          </div>

          {/* Footer Buttons */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
            <Button type="button" variant="danger" onClick={onClose}>
              Back
            </Button>
            <Button type="button" variant="secondary" onClick={onSubmit}>
              Submit
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
