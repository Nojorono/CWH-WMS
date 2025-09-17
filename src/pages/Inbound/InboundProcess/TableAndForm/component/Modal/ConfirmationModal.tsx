import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useState } from "react";
import Button from "../../../../../../components/ui/button/Button";
import { FormValues } from "../formTypes";
import React from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

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
  const totalSKU = allItems.length;

  // summary per SKU
  const skuSummary = allItems.reduce((acc: Record<string, number>, item) => {
    const key = item.description ?? "Unknown SKU";
    acc[key] =
      (acc[key] || 0) + (typeof item.qty === "number" ? item.qty : 0);
    return acc;
  }, {});

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
        <DialogPanel className="bg-white rounded-2xl shadow-2xl max-w-[90vw] w-full max-h-[98vh] overflow-y-auto">
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
                    Tujuan
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
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
                    value={formData.arrival_date}
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
                  <p className="text-2xl font-bold text-gray-900">{totalQty}</p>
                  <p className="text-xs text-gray-500">Total Quantity</p>
                </div>
              </div>

              <h3 className="font-medium text-gray-700 mb-2">Summary SKU</h3>
              <ul className="text-sm list-disc list-inside space-y-1 text-gray-700">
                {Object.entries(skuSummary).map(([desc, qty]) => (
                  <li key={desc}>
                    {desc} — <b>{qty}</b>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 3: DO Detail Table (Expandable) */}
            <section>
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Detail Surat Jalan
              </h2>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-3 py-2 border text-center"></th>
                      <th className="px-3 py-2 border">DO No</th>
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
                          {/* Parent Row */}
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

                          {/* Expandable Row */}
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
            </section>
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
