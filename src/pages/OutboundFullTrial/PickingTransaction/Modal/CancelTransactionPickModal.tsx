import React, { memo, useState } from "react";
import Button from "../../../../components/ui/button/Button";
import { formatDateIndo } from "../../../../helper/FormatDate";
import KeyValueCard from "../../Picking/Helper/KeyValueCard";
import { mapTransactionToUI } from "../Helper/mapTransactionToUI";
import { FaChevronDown, FaChevronRight, FaWindowClose } from "react-icons/fa";
import { EndPoint } from "../../../../utils/EndPoint";
import { useNavigate } from "react-router-dom";

type CancelTransactionPickModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  transactionData: any;
};

const CancelTransactionPickModal: React.FC<CancelTransactionPickModalProps> = ({
  isOpen,
  onRequestClose,
  transactionData,
}) => {
  const navigate = useNavigate();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const handleCancelPicking = async (pickingId: string) => {
    if (!pickingId) return;

    const confirm = window.confirm(
      "Are you sure you want to cancel this Picking Transaction?"
    );

    if (!confirm) return;

    const transactionId = pickingId;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${EndPoint}transaction-picking/${transactionId}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      onRequestClose();
      navigate("/picking_transaction");
    } catch (error) {
      console.error("Error detaching transaction:", error);
    }
  };

  if (!isOpen || !transactionData) return null;

  const uiData = mapTransactionToUI(transactionData);

  const toggleExpand = (itemId: string) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/70">
      <div className="bg-white w-[90vw] max-w-[1200px] max-h-[90vh] overflow-y-auto rounded-xl shadow-xl p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center">
          Cancel List Task & Scan Picking
        </h2>

        {/* ===== TRANSACTION HEADER ===== */}
        <KeyValueCard
          title="Transaction Details"
          data={{
            memo_id: uiData.memo.id,
            memo_number: uiData.memo.number,
            status: uiData.memo.status,
            type: uiData.memo.type,
            origin: uiData.memo.origin,
            destination: uiData.memo.destination,
            ship_to: uiData.memo.shipTo,
            requestor: uiData.memo.requestor,
            delivery_date: formatDateIndo(uiData.memo.deliveryDate),
            notes: uiData.memo.notes,
          }}
          labelMap={{
            memo_id: "Memo ID",
            memo_number: "Memo Number",
            status: "Status Memo",
            type: "Type",
            origin: "Origin",
            destination: "Destination",
            ship_to: "Ship To",
            requestor: "Requestor",
            delivery_date: "Delivery Date",
            notes: "Notes",
          }}
        />

        {/* ===== ITEMS (COLLAPSIBLE) ===== */}
        <div className="space-y-4">
          {uiData.items.map((item: any) => {
            const isOpen = expandedItemId === item.itemId;

            return (
              <div
                key={item.itemId}
                className="border rounded-xl shadow-sm bg-white"
              >
                {/* HEADER CLICKABLE */}
                <button
                  onClick={() => toggleExpand(item.itemId)}
                  className={`
    w-full flex justify-between items-center p-4
    bg-blue-50 border-l-4 border-blue-500
    hover:bg-blue-100 transition rounded-t-lg
    cursor-pointer
  `}
                >
                  <div className="text-left space-y-1">
                    <p className="font-semibold text-gray-900">
                      {item.sku} - {item.description}
                    </p>
                    <p className="text-sm text-gray-600">
                      Memo Plan: {item.plannedQty} {item.uom}
                    </p>
                  </div>

                  <span
                    className="
    text-blue-600 text-xl font-bold
    w-8 h-8 flex items-center justify-center
    rounded-full bg-white shadow-sm
  "
                  >
                    {isOpen ? <FaChevronDown /> : <FaChevronRight />}
                  </span>
                </button>

                {/* EXPANDED CONTENT */}
                {isOpen && (
                  <div className="p-4 space-y-4 border-t">
                    {/* PICKINGS */}
                    {item.pickings.length > 0 ? (
                      item.pickings.map((p: any) => (
                        <KeyValueCard
                          key={p.pickingId}
                          title={
                            <div className="flex items-center justify-between w-full gap-4">
                              {/* LEFT TITLE */}
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">
                                  Transaction Picking
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                  ({p.pickingId})
                                </span>
                              </div>

                              {/* RIGHT BUTTON */}
                              <Button
                                type="button"
                                variant="danger"
                                size="xsm"
                                startIcon={<FaWindowClose />}
                                onClick={() => {
                                  handleCancelPicking(p.pickingId);
                                }}
                              >
                                Cancel this Task
                              </Button>
                            </div>
                          }
                          data={{
                            status: p.status,
                            quantity: p.quantity,
                            uom: p.uom,
                            week_number: p.weekNumber,
                            source: `${p.source.warehouse}/${p.source.bin}`,
                            destination: `${p.destination.warehouse}/${p.destination.bin}`,
                          }}
                          labelMap={{
                            status: "Status Transaction Picking",
                            quantity: "Qty Suggestion",
                            uom: "UOM",
                            week_number: "Week Number",
                            source: "Source Zone/Bin",
                            destination: "Destination Zone/Bin",
                          }}
                        />
                      ))
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                        Item ini belum memiliki Suggest Location Picking!
                      </div>
                    )}

                    {/* ITEM DETAIL */}
                    <KeyValueCard
                      title="Item Details"
                      data={{
                        sku: item.sku,
                        item_number: item.itemNumber,
                        description: item.description,
                        planned_qty: item.plannedQty,
                        uom: item.uom,
                      }}
                      labelMap={{
                        sku: "SKU",
                        item_number: "Item Number",
                        description: "Description",
                        planned_qty: "Planned Qty",
                        uom: "UOM",
                      }}
                    />

                    {/* SCAN HISTORY */}
                    {item.pickings.flatMap((p: any) => p.scans).length > 0 ? (
                      item.pickings
                        .flatMap((p: any) => p.scans)
                        .map((s: any, i: number) => (
                          <KeyValueCard
                            key={i}
                            title={
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">
                                  Scan Picking History
                                </span>
                                <span className="text-xs text-gray-500 font-mono">
                                  ({s.scanId})
                                </span>
                              </div>
                            }
                            data={{
                              pallet_source: s.palletSource,
                              pallet_use: s.palletUse,
                              qty_picked: s.quantityPicked,
                              uom: s.uom,
                              week: s.weekNumber,
                              status: s.status,
                              user_name: s.userName,
                              inspection_by: s.inspectionBy,
                            }}
                            labelMap={{
                              pallet_source: "Pallet Source",
                              pallet_use: "Picking Pallet",
                              qty_picked: "Qty Picked",
                              uom: "UOM",
                              week: "Week",
                              status: "Status Scan",
                              user_name: "User Name",
                              inspection_by: "Inspection By",
                            }}
                          />
                        ))
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                        Item ini belum ada proses Scan Picking!
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ===== ACTIONS ===== */}
        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="danger" onClick={onRequestClose}>
            Back
          </Button>

          {/* <Button type="button" variant="secondary" onClick={handleDetach}>
            Confirm Cancel Task
          </Button> */}
        </div>
      </div>
    </div>
  );
};

export default CancelTransactionPickModal;
