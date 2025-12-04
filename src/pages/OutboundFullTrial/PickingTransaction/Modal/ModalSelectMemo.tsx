import React, { useState, useMemo } from "react";
import Button from "../../../../components/ui/button/Button";
import Select from "../../../../components/form/Select"; // pastikan path sesuai
import { showErrorToast } from "../../../../components/toast";
import { EndPoint } from "../../../../utils/EndPoint";
import axios from "axios"; // pastikan axios di-import
import { useNavigate } from "react-router-dom";

type ModalSelectMemoProps = {
  isOpen?: boolean;
  onClose?: () => void;
  memos: any[];
  selectedTransactions: string[]; // Tambahkan prop untuk transaksi yang dipilih
};

const ModalSelectMemo: React.FC<ModalSelectMemoProps> = ({
  isOpen,
  onClose,
  memos,
  selectedTransactions, // Ambil selectedTransactions dari props
}) => {
  const navigate = useNavigate();
  const [selectedMemo, setSelectedMemo] = useState("");

  const selectedMemoObj = useMemo(() => {
    return memos.find((m) => m.id === selectedMemo);
  }, [selectedMemo, memos]);

  // Mapping data API → label untuk dropdown
  const mappedMemos = useMemo(() => {
    return memos.map((m) => {
      const firstItem = m.outbound_memo_items?.[0];
      const itemInfo = firstItem
        ? `Existing Plan (${firstItem.quantity_plan} ${firstItem.uom} (${firstItem.item.sku})`
        : "No Item";
      return {
        value: m.id,
        label: `${m.outbound_memo_number} — ${itemInfo} `,
      };
    });
  }, [memos]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedMemo) return;
    if (selectedTransactions.length === 0) {
      showErrorToast("Please select at least one transaction to attach.");
      return;
    }

    // Implement the API call
    if (selectedTransactions.length > 0) {
      try {
        const token = localStorage.getItem("token"); // Get token from localStorage
        const response = await axios.patch(
          `${EndPoint}transaction-picking/memo/${selectedMemo}/attach`, // Ganti transactionData.id dengan selectedMemo
          { transactionIds: selectedTransactions }, // Kirim transactionIds
          {
            headers: {
              Authorization: `Bearer ${token}`, // Use the token from localStorage
              "Content-Type": "application/json",
              accept: "*/*",
            },
          }
        );
        console.log("Attach response:", response.data);
        navigate("/picking_transaction");
      } catch (error) {
        showErrorToast(`${error}`);
        console.error("Error attaching transactions:", error);
      }
    }
    onClose?.();
  };

  const handleCancel = () => {
    setSelectedMemo("");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-[95vw] max-w-[900px] rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Pilih Memo yang akan di Attach
        </h2>
        <label className="text-lg font-medium text-gray-700 mb-2 block">
          List Memo sesuai dengan Item pada Transaction Picking yang dipilih
        </label>
        <Select
          options={mappedMemos}
          value={selectedMemo}
          onChange={setSelectedMemo}
          placeholder="— Silakan pilih memo —"
          width="100%"
        />

        {selectedMemoObj && (
          <div className="mt-6 p-4 rounded-xl border bg-gray-50 shadow">
            <h3 className="text-lg font-semibold mb-2 text-blue-700">
              Detail Memo
            </h3>
            <div className="grid grid-cols-2 gap-2 text-gray-700 text-sm">
              <div>
                <strong>Memo Number:</strong>{" "}
                {selectedMemoObj.outbound_memo_number}
              </div>
              <div>
                <strong>Status:</strong> {selectedMemoObj.status}
              </div>
              <div>
                <strong>Requestor:</strong> {selectedMemoObj.requestor}
              </div>
              <div>
                <strong>Origin:</strong> {selectedMemoObj.origin}
              </div>
              <div>
                <strong>Destination:</strong> {selectedMemoObj.destination}
              </div>
              <div>
                <strong>Delivery Date:</strong>{" "}
                {selectedMemoObj.delivery_date?.slice(0, 10)}
              </div>
              <div className="col-span-2">
                <strong>Notes:</strong> {selectedMemoObj.notes}
              </div>
              <div className="col-span-2">
                <strong>Plan Items:</strong>
                <ul className="ml-4 list-disc">
                  {selectedMemoObj.outbound_memo_items?.map((item: any) => (
                    <li key={item.id}>
                      {item.item?.description} — Qty Plan {item.quantity_plan}{" "}
                      {item.uom}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 mt-4">
                <strong className="text-lg">Existing Suggestion:</strong>
                <ul className="ml-4 list-disc">
                  {selectedMemoObj.transaction_pickings?.length ? (
                    selectedMemoObj.transaction_pickings.map((trx: any) => (
                      <li key={trx.id} className="mb-4">
                        <strong className="font-semibold">Suggestion :</strong>
                        <div className="bg-gray-100 p-2 rounded-md mt-1">
                          <span className="font-medium">Item:</span>{" "}
                          {trx.item_id} <br />
                          <span className="font-medium">Qty:</span>{" "}
                          {trx.quantity} <br />
                          <span className="font-medium">Status:</span>{" "}
                          {trx.status} <br />
                          <span className="font-medium">UOM:</span> {trx.uom}{" "}
                          <br />
                          <span className="font-medium">Week:</span>{" "}
                          {trx.week_number}
                        </div>
                        {trx.transactionScanPicking?.length ? (
                          <ul className="ml-4 list-decimal mt-2">
                            {trx.transactionScanPicking.map((scan: any) => (
                              <li
                                key={scan.id}
                                className="mb-2 bg-gray-50 p-2 rounded-md"
                              >
                                <strong>Scanned Picking:</strong>
                                <div>
                                  <strong>Scan ID:</strong> {scan.id} <br />
                                  <strong>Qty Picked:</strong>{" "}
                                  {scan.quantity_picked} {scan.uom} <br />
                                  <strong>Status:</strong> {scan.status} <br />
                                  <strong>Switch Pallet:</strong>{" "}
                                  {scan.pallet_switch_id ?? "-"} <br />
                                  <strong>Week:</strong> {scan.week_number}{" "}
                                  <br />
                                  <strong>User:</strong> {scan.user_name} <br />
                                  <strong>Inspection By:</strong>{" "}
                                  {scan.inspection_by}
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-red-500">
                            Belum ada Suggestion
                          </span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-red-500">Belum ada Suggestion</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button onClick={handleCancel} variant="danger" type="button">
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMemo}
            variant="action"
            type="button"
          >
            Attach to this Memo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ModalSelectMemo;
