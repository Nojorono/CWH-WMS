import React, { useEffect, useState } from "react";
import Button from "../../../../components/ui/button/Button";
import { useStorePickingTransactionList } from "../../../../DynamicAPI/stores/Store/MasterStore";
import axios from "axios";
import { EndPoint } from "../../../../utils/EndPoint";
import { useNavigate } from "react-router-dom";
import { showErrorToast } from "../../../../components/toast";

type AttachTransactionPickingModalProps = {
  isOpen: boolean;
  onRequestClose: () => void;
  transactionData: any; // Ganti dengan tipe data yang sesuai
};

const AttachTransactionPickingModal: React.FC<
  AttachTransactionPickingModalProps
> = ({ isOpen, onRequestClose, transactionData }) => {
  const navigate = useNavigate();

  const [selectedTransactions, setSelectedTransactions] = useState<string[]>(
    []
  );
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(
    null
  );
  const { fetchUsingParam, list } = useStorePickingTransactionList();

  useEffect(() => {
    fetchUsingParam({ has_memo_id: false });
  }, [fetchUsingParam]);

  const handleTransactionSelect = (transactionId: string) => {
    setSelectedTransactions(
      (prev) =>
        prev.includes(transactionId)
          ? prev.filter((id) => id !== transactionId) // Hapus jika sudah ada
          : [...prev, transactionId] // Tambah jika belum ada
    );
  };

  const handleAttach = async () => {
    if (selectedTransactions.length === 0) {
      showErrorToast("Please select at least one transaction to attach.");
      return;
    }

    // Implement the API call
    if (selectedTransactions.length > 0) {
      try {
        const token = localStorage.getItem("token"); // Get token from localStorage
        const response = await axios.patch(
          `${EndPoint}transaction-picking/memo/${transactionData.id}/attach`,
          { transactionIds: selectedTransactions },
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
        onRequestClose();
      } catch (error) {
        showErrorToast(`${error}`);
        console.error("Error attaching transactions:", error);
      }
    }
  };

  const toggleExpandTransaction = (transactionId: string) => {
    setExpandedTransaction((prev) =>
      prev === transactionId ? null : transactionId
    );
  };

  if (!isOpen) return null;

  console.log("List of transactions:", list);

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/70">
      <div className="bg-white w-[90vw] max-w-[600px] rounded-lg shadow-xl p-6">
        <h3 className="text-2xl font-bold text-center mb-4">
          Attach Transaction Picking to this Memo
          <span className="block text-lg font-medium mt-2">
            {transactionData.outbound_memo_number} - {transactionData.id}
          </span>
        </h3>

        <div className="mb-4">
          <p className="text-lg">
            Pilih transaksi picking yang ingin dilampirkan ke dalam memo:
          </p>
          <ul>
            {list
              .filter(
                (transaction: any) =>
                  transaction.transactionScanPicking.length > 0
              )
              .map((transaction: any) => (
                <li key={transaction.id} className="mb-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => handleTransactionSelect(transaction.id)}
                    />
                    <span
                      className="ml-2 cursor-pointer"
                      onClick={() => toggleExpandTransaction(transaction.id)}
                    >
                      {transaction.item?.description} - Qty:{" "}
                      {transaction.quantity} {transaction.uom}
                    </span>
                  </div>
                  {expandedTransaction === transaction.id && (
                    <div className="ml-4 mt-2 p-2 border rounded bg-gray-100">
                      <p>
                        <strong>DO ID:</strong> {transaction.do_id}
                      </p>
                      <p>
                        <strong>Status:</strong> {transaction.status}
                      </p>
                      <p>
                        <strong>Source Warehouse:</strong>{" "}
                        {transaction.sourceWarehouseSub?.name}
                      </p>
                      <p>
                        <strong>Destination Warehouse:</strong>{" "}
                        {transaction.destination_warehouse_sub_id}
                      </p>
                      <p>
                        <strong>Transaction Scan Picking:</strong>
                      </p>
                      <ul>
                        {transaction.transactionScanPicking.map((scan: any) => (
                          <li key={scan.id}>
                            <p>
                              <strong>Scan ID:</strong> {scan.id}
                            </p>
                            <p>
                              <strong>Quantity Picked:</strong>{" "}
                              {scan.quantity_picked} {scan.uom}
                            </p>
                            <p>
                              <strong>Week Number:</strong> {scan.week_number}
                            </p>
                            <p>
                              <strong>Picker:</strong> {scan.user_name}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
          </ul>
        </div>

        <div className="flex justify-end mt-6 space-x-2">
          <Button
            type="button"
            variant="action"
            onClick={handleAttach}
            disabled={selectedTransactions.length === 0}
          >
            Attach
          </Button>
          <Button type="button" variant="danger" onClick={onRequestClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AttachTransactionPickingModal;
