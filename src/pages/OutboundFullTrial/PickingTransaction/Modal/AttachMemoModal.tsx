import React, { useEffect, useState } from "react";
import Button from "../../../../components/ui/button/Button";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useNavigate } from "react-router-dom";
import { EndPoint } from "../../../../utils/EndPoint";
import KeyValueCard from "../../Picking/Helper/KeyValueCard";
import { formatDateIndo } from "../../../../helper/FormatDate";
import { FaChevronRight } from "react-icons/fa";

type AttachMemoModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  detailDO: any;
};

const AttachMemoModal: React.FC<AttachMemoModalProps> = ({
  isOpen,
  onRequestClose,
  detailDO,
}) => {
  const navigate = useNavigate();
  const [memoData, setMemoData] = React.useState<any>({});
  const { fetchUsingPagination, list } = useStoreOutboundMemo();

  useEffect(() => {
    if (!isOpen) return;

    if (typeof fetchUsingPagination === "function") {
      fetchUsingPagination({
        page: 1,
        limit: 100,
        has_do: false,
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    setMemoData({});
    onRequestClose();
  };

  const handleSubmit = async () => {
    const attachedMemoData = {
      memoId: memoData.id,
      do_id: detailDO.outbound_do_number,
      sequence: "",
    };

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${EndPoint}outbound-do/${detailDO.id}/attach-memo?memoId=${memoData.id}&sequence=${attachedMemoData.sequence}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Network response was not ok");

      handleClose();
      navigate("/picking_transaction");
    } catch (error) {
      console.error("Error Attaching Memo:", error);
    }
  };

  // =================== DATA MERGING ===================
  const selectedMemo = list.find((memo: any) => memo.id === memoData.id);

  const selectedMemoFromDO = detailDO?.outbound_memos?.find(
    (memo: any) => memo.id === memoData.id
  );

  const mergedSelectedMemo = selectedMemo
    ? {
        ...selectedMemo,
        transaction_pickings: selectedMemoFromDO?.transaction_pickings || [],
      }
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white w-[95vw] max-w-[950px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 space-y-5">
        {/* TITLE */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            Attach Memo to{" "}
            <span className="text-orange-600">
              {detailDO.outbound_do_number}
            </span>
          </h2>
        </div>

        {/* SELECT MEMO */}
        <select
          className="border rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
          onChange={(e) => setMemoData({ ...memoData, id: e.target.value })}
        >
          <option value="">Select Memo</option>
          {list.map((memo: any) => (
            <option key={memo.id} value={memo.id}>
              {memo.outbound_memo_number} - {memo.type}
            </option>
          ))}
        </select>

        {/* DETAIL MEMO */}
        {mergedSelectedMemo && (
          <div className="bg-gray-50 p-4 rounded-2xl border space-y-6 shadow-inner">
            {/* MEMO HEADER */}
            <KeyValueCard
              title="Memo Details"
              data={{
                outbound_memo_number: mergedSelectedMemo.outbound_memo_number,
                requestor: mergedSelectedMemo.requestor,
                origin: mergedSelectedMemo.origin,
                ship_to: mergedSelectedMemo.ship_to,
                destination: mergedSelectedMemo.destination,
                type: mergedSelectedMemo.type,
                status: mergedSelectedMemo.status,
                delivery_date: formatDateIndo(mergedSelectedMemo.delivery_date),
                has_do: mergedSelectedMemo.has_do ? "Yes" : "No",
                notes: mergedSelectedMemo.notes,
              }}
              labelMap={{
                outbound_memo_number: "Memo Number",
                requestor: "Requestor",
                origin: "Origin",
                ship_to: "Ship To",
                destination: "Destination",
                type: "Type",
                status: "Status",
                delivery_date: "Delivery Date",
                has_do: "Has DO",
                notes: "Notes",
              }}
            />

            {/* ITEMS */}
            <div className="space-y-4">
              {mergedSelectedMemo.outbound_memo_items?.map((item: any) => {
                const relatedTransactions =
                  mergedSelectedMemo.transaction_pickings?.filter(
                    (trx: any) => trx.item_id === item.item_id
                  ) || [];

                return (
                  <details
                    key={item.id}
                    className="group rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden transition-all duration-300"
                  >
                    {/* HEADER */}
                    <summary className="cursor-pointer list-none p-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.item?.description}
                          <span className="ml-2 text-xs text-gray-500">
                            ({item.item?.sku})
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Planned: {item.quantity_plan} {item.uom}
                        </p>
                      </div>

                      <FaChevronRight className="transition-transform duration-300 group-open:rotate-90 text-blue-600" />
                    </summary>

                    {/* BODY */}
                    <div className="p-4 border-t space-y-5 bg-white">
                      {/* ITEM INFO */}
                      <KeyValueCard
                        title="Item Information"
                        data={{
                          sku: item.item?.sku,
                          item_number: item.item?.item_number,
                          quantity_plan: `${item.quantity_plan} ${item.uom}`,
                        }}
                        labelMap={{
                          sku: "SKU",
                          item_number: "Item Number",
                          quantity_plan: "Planned Quantity",
                        }}
                      />

                      {/* TRANSACTION INFO */}
                      <div className="space-y-3">
                        {relatedTransactions.length === 0 ? (
                          <p className="text-sm text-gray-400 italic">
                            No transactions
                          </p>
                        ) : (
                          relatedTransactions.map((trx: any) => (
                            <KeyValueCard
                              key={trx.id}
                              title={`Transaction ${trx.id.slice(0, 8)}...`}
                              data={{
                                quantity: `${trx.quantity} ${trx.uom}`,
                                week_number: trx.week_number,
                                status: trx.status,
                                source_sub: trx.sourceWarehouseSub?.name,
                                source_bin: trx.sourceBin?.name,
                                destination_sub:
                                  trx.destinationWarehouseSub?.name,
                                destination_bin: trx.destinationBin?.name,
                              }}
                              labelMap={{
                                quantity: "Quantity",
                                week_number: "Week",
                                status: "Status",
                                source_sub: "Source Sub Warehouse",
                                source_bin: "Source Bin",
                                destination_sub: "Destination Sub Warehouse",
                                destination_bin: "Destination Bin",
                              }}
                            />
                          ))
                        )}
                      </div>

                      {/* SCAN INFO */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">
                          Scan Picking Details
                        </h4>

                        {relatedTransactions.flatMap(
                          (trx: any) => trx.transactionScanPicking || []
                        ).length === 0 ? (
                          <p className="text-sm text-gray-400 italic">
                            No scan data
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {relatedTransactions.flatMap((trx: any) =>
                              trx.transactionScanPicking?.map((scan: any) => (
                                <KeyValueCard
                                  key={scan.id}
                                  title={`Scan ${scan.id.slice(0, 8)}...`}
                                  data={{
                                    quantity_picked: `${scan.quantity_picked} ${scan.uom}`,
                                    week_number: scan.week_number,
                                    status: scan.status,
                                    user_name: scan.user_name,
                                    inspection_by: scan.inspection_by,
                                  }}
                                  labelMap={{
                                    quantity_picked: "Qty Picked",
                                    week_number: "Week",
                                    status: "Status",
                                    user_name: "Picked By",
                                    inspection_by: "Inspection By",
                                  }}
                                />
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-end gap-2 pt-5 border-t">
          <Button
            size="sm"
            type="button"
            variant="danger"
            onClick={handleClose}
          >
            Cancel
          </Button>

          <Button
            size="sm"
            type="button"
            variant="action"
            onClick={handleSubmit}
            disabled={!memoData.id}
          >
            Attach to this DO
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttachMemoModal;