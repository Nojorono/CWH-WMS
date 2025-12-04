import React, { useEffect, useState } from "react";
import Button from "../../../../components/ui/button/Button";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import { useNavigate } from "react-router-dom";
import { EndPoint } from "../../../../utils/EndPoint";

type AttachMemoModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  detailDO: any; // Ganti dengan tipe data yang sesuai
};

const AttachMemoModal: React.FC<AttachMemoModalProps> = ({
  isOpen,
  onRequestClose,
  detailDO,
}) => {
  const navigate = useNavigate();
  const [memoData, setMemoData] = React.useState<any>({}); // Ganti dengan tipe data yang sesuai
  const { fetchUsingPagination, list, pagination } = useStoreOutboundMemo();

  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(100);

  useEffect(() => {
    if (!isOpen) return; // hanya fetch saat modal terbuka
    setPageIndex(0); // reset pagination saat open
    setPageSize(100);

    // pastikan fungsi tersedia sebelum call
    if (typeof fetchUsingPagination === "function") {
      fetchUsingPagination({
        page: 1,
        limit: 100,
        has_do: false,
      });
    }
  }, [isOpen]); // depend hanya pada isOpen

  const handleClose = () => {
    setMemoData({}); // Reset state memoData
    onRequestClose(); // Panggil fungsi onRequestClose
  };

  const handleSubmit = async () => {
    const attachedMemoData = {
      memoId: memoData.id,
      do_id: detailDO.outbound_do_number,
      sequence: "", // Menyertakan sequence jika ada
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

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      handleClose();
      navigate("/picking_transaction");
    } catch (error) {
      console.error("Error Attaching Memo:", error);
    }
  };

  // Mendapatkan detail memo yang dipilih
  const selectedMemo = list.find((memo: any) => memo.id === memoData.id);

  if (!isOpen) return null; // Jika modal tidak terbuka, tidak render apa-apa

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/70">
      <div className="bg-white w-[90vw] max-w-[800px] max-h-[90vh] overflow-y-auto rounded-lg shadow-xl p-6">
        <h2 className="text-lg font-semibold">
          Attach Memo to {detailDO.outbound_do_number} - {detailDO.id}
        </h2>
        <div className="mt-4">
          {/* Dropdown select untuk memo data */}
          <select
            className="border rounded p-2 w-full mb-4"
            onChange={(e) => setMemoData({ ...memoData, id: e.target.value })}
          >
            <option value="">Select Memo</option>
            {list.map((memo: any) => (
              <option key={memo.id} value={memo.id}>
                {memo.outbound_memo_number} - {memo.type}
              </option>
            ))}
          </select>
        </div>

        {/* Card untuk menampilkan detail memo */}
        {selectedMemo && (
          <div className="mt-4 p-4 rounded-xl border bg-gray-50 shadow">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">
              Detail Memo
            </h3>
            <div className="grid grid-cols-2 gap-2 text-gray-700 text-sm">
              <div>
                <strong>Memo Number:</strong>{" "}
                {selectedMemo.outbound_memo_number}
              </div>
              <div>
                <strong>Type:</strong> {selectedMemo.type}
              </div>
              <div>
                <strong>Status:</strong> {selectedMemo.status}
              </div>
              <div>
                <strong>Requestor:</strong> {selectedMemo.requestor}
              </div>
              <div>
                <strong>Notes:</strong> {selectedMemo.notes}
              </div>
              <div>
                <strong>Has DO Number:</strong>{" "}
                {selectedMemo.has_do ? "Yes" : "No"}
              </div>
            </div>

            {/* Menampilkan detail item dari outbound_memo_items */}
            <h4 className="mt-4 font-semibold">Detail Items:</h4>
            <ul className="ml-4 list-disc">
              {selectedMemo.outbound_memo_items.map((item: any) => (
                <li key={item.id} className="mb-2">
                  <div>
                    <strong>Item Description:</strong> {item.item.description}
                  </div>
                  <div>
                    <strong>SKU:</strong> {item.item.sku}
                  </div>
                  <div>
                    <strong>Quantity Plan:</strong> {item.quantity_plan}{" "}
                    {item.uom}
                  </div>
                </li>
              ))}
            </ul>

            {/* Menampilkan detail transaction_pickings jika ada */}
            {selectedMemo.transaction_pickings.length > 0 && (
              <>
                <h4 className="mt-4 font-semibold">Transaction Pickings:</h4>
                <ul className="ml-4 list-disc">
                  {selectedMemo.transaction_pickings.map((trx: any) => (
                    <li key={trx.id} className="mb-2">
                      <div>
                        <strong>Transaction ID:</strong> {trx.id}
                      </div>
                      <div>
                        <strong>Quantity:</strong> {trx.quantity} {trx.uom}
                      </div>
                      <div>
                        <strong>Week Number:</strong> {trx.week_number}
                      </div>
                      <div>
                        <strong>Status:</strong> {trx.status}
                      </div>
                      {/* Tambahkan detail lain dari transaction jika diperlukan */}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <Button type="button" variant="danger" onClick={handleClose}>
            Cancel
          </Button>
          <div className="mx-2" />
          <Button
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
