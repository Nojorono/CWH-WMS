import React, { useState } from "react";
import Button from "../../../../components/ui/button/Button";
import KeyValueCard from "../../Picking/Helper/KeyValueCard";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

interface TransactionPickingsModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  items: any[] | any;
}

const TransactionPickingsModal: React.FC<TransactionPickingsModalProps> = ({
  isOpen,
  onRequestClose,
  items,
}) => {
  if (!isOpen) return null;

  console.log("items modal picking detail", items);
  

  // Normalisasi data
  const normalizedItems = Array.isArray(items) ? items : items ? [items] : [];

  // Sort items berdasarkan status
  const sortedItems = normalizedItems.sort((a, b) => {
    const statusOrder = {
      PENDING: 1,
      INSPECTION: 2,
      CANCELLED: 3, // CANCELLED ditempatkan paling bawah
    };

    return (
      (statusOrder[a.status as keyof typeof statusOrder] || 4) -
      (statusOrder[b.status as keyof typeof statusOrder] || 4)
    );
  });

  // State untuk expand per item (by index)
  const [expandedMap, setExpandedMap] = useState<Record<number, boolean>>({});

  const toggleExpand = (index: number) => {
    setExpandedMap((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="bg-white w-[95vw] max-w-[950px] rounded-2xl shadow-2xl p-8 overflow-hidden max-h-[85vh] flex flex-col">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Suggestion & Transaction Picking Details
          </h2>
        </div>

        {/* BODY */}
        <div className="overflow-y-auto pr-2 space-y-4 flex-1">
          {sortedItems.length === 0 ? (
            <p className="text-red-500 text-sm">
              No Suggestion & Transaction scan items yet!
            </p>
          ) : (
            sortedItems.map((trx: any, idx: number) => {
              const isOpenItem = expandedMap[idx] ?? false;

              return (
                <div
                  key={trx.id || idx}
                  className="border border-gray-200 rounded-2xl bg-white shadow-sm"
                >
                  {/* CLICKABLE HEADER */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(idx)}
                    className="w-full flex justify-between items-center p-5 hover:bg-gray-50 transition bg-blue-100"
                  >
                    <div className="text-left">
                      <p className="font-semibold text-gray-800">
                        {trx?.item?.description ?? "-"}
                        <span className="text-sm text-gray-500 ml-2">
                          ({trx?.item?.sku ?? "-"})
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Qty Plan {trx?.quantity ?? "-"} {trx?.uom}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">
                        {trx.transactionScanPicking.length === 0 ? (
                          <span className="text-sm text-red-500">Belum dilakukan proses scan picking</span>
                        ) : (
                          <span className="text-sm text-green-500">Sudah di-scan picking</span>
                        )}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          trx?.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : trx?.status === "INSPECTION"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-200 text-red-700"
                        }`}
                      >
                        {trx?.status ?? "-"}
                      </span>

                      {isOpenItem ? (
                        <FaChevronUp className="text-gray-500" />
                      ) : (
                        <FaChevronDown className="text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* EXPANDABLE CONTENT */}
                  {isOpenItem && (
                    <div className="px-5 pb-6 space-y-5 border-t border-gray-100">
                      {/* ITEM INFO */}
                      <div className="pt-4">
                        <KeyValueCard
                          title="Picking Suggestion Info"
                          data={{
                            quantity: `${trx?.quantity ?? "-"} ${
                              trx?.uom ?? ""
                            }`,
                            week_number: trx?.week_number ?? "-",
                            status: trx?.status ?? "-",
                          }}
                          labelMap={{
                            quantity: "Quantity Plan",
                            week_number: "Week Number",
                            status: "Status",
                          }}
                        />
                      </div>

                      {/* LOCATION INFO */}
                      <KeyValueCard
                        title="Picking Location Info"
                        data={{
                          source_warehouse:
                            trx?.sourceWarehouseSub?.name ?? "-",
                          source_bin:
                            trx?.sourceBin?.name ?? trx?.sourceBin?.code ?? "-",
                          destination_warehouse:
                            trx?.destinationWarehouseSub?.name ?? "-",
                          destination_bin:
                            trx?.destinationBin?.name ??
                            trx?.destinationBin?.code ??
                            "-",
                        }}
                        labelMap={{
                          source_warehouse: "Source Location",
                          source_bin: "Source Bin",
                          destination_warehouse: "Destination Location",
                          destination_bin: "Destination Bin/Line",
                        }}
                      />

                      {/* SCANS */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800">
                          Transaction Scan Picking
                        </h4>

                        {!trx?.transactionScanPicking ||
                        trx.transactionScanPicking.length === 0 ? (
                          <p className="text-red-500 text-sm italic">
                            Belum ada data scan picking
                          </p>
                        ) : (
                          trx.transactionScanPicking.map((scan: any) => (
                            <KeyValueCard
                              key={scan.id}
                              title={`Scan ${
                                scan?.palletUse?.pallet_code ?? "-"
                              }`}
                              data={{
                                pallet_source:
                                  scan?.palletSource?.pallet_code ?? "-",
                                pallet_use: scan?.palletUse?.pallet_code ?? "-",
                                quantity_picked: scan?.quantity_picked ?? "-",
                                UOM: scan?.uom ?? "-",
                                week_number: scan?.week_number ?? "-",
                                User: scan?.user_name ?? "-",
                                inspection_by: scan?.inspection_by ?? "-",
                                status: scan?.status ?? "-",
                              }}
                              labelMap={{
                                pallet_source: "Pallet Source",
                                pallet_use: "Pallet Use",
                                quantity_picked: "Qty Picked",
                                week_number: "Week Number",
                                inspection_by: "Inspection By",
                              }}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="pt-4 text-right bg-white sticky bottom-0 border-t mt-4">
          <Button onClick={onRequestClose} variant="danger">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionPickingsModal;
