import React, { useEffect, useState } from "react";
import { OutboundDo, OutboundMemo } from "../Helper/doTypes";
import { useStoreOutboundMemo } from "../../../../DynamicAPI/stores/Store/MasterStore";
import Swal from "sweetalert2"; // Import SweetAlert

type DetachAttachModalProps = {
  open: boolean;
  onClose: () => void;
  data?: OutboundDo | null; // Update type to OutboundDo

  availableMemos?: OutboundMemo[]; // Update to use OutboundMemo
  availableDOs?: string[]; // Keep as string[] if DOs are still strings

  onDetachMemo?: (payload: {
    memoId: string;
    doId: string;
  }) => Promise<void> | void;

  onDetachTransaction?: (payload: {
    transactionId: string;
    memoId: string;
    doId: string;
  }) => Promise<void> | void;

  onAttachMemo?: (payload: {
    memoId: string;
    doId: string;
  }) => Promise<void> | void;
};

const DetachAttachModal: React.FC<DetachAttachModalProps> = ({
  open,
  onClose,
  data,

  onDetachMemo,
  onDetachTransaction,
  onAttachMemo,
}) => {
  const { fetchUsingParam, list: memoList } = useStoreOutboundMemo();

  useEffect(() => {
    fetchUsingParam({
      has_do: false,
    });
  }, [fetchUsingParam]);

  const [selectedDetachMemo, setSelectedDetachMemo] = useState<string>("");
  const [selectedAttachMemo, setSelectedAttachMemo] = useState<string>("");
  const [selectedMemoDetails, setSelectedMemoDetails] = useState<any | null>(
    null
  ); // State untuk menyimpan detail memo yang dipilih

  const [selectedTransaction, setSelectedTransaction] = useState<string>("");
  const [selectedDO, setSelectedDO] = useState<string>(""); // Tambahkan state untuk selectedDO
  const [activeTab, setActiveTab] = useState<"memo" | "do">("memo");
  const [filteredTransactionPickings, setFilteredTransactionPickings] =
    useState<any[]>([]);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null); // State to track which accordion is open

  if (!open) return null;

  const currentMemoIds = data?.memo_id || [];
  const transactionPickings =
    data?.outbound_memos?.flatMap((memo) => memo.transaction_pickings) || [];

  const toggleAccordion = (accordion: string) => {
    setOpenAccordion(openAccordion === accordion ? null : accordion);
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50">
      <div className="bg-white w-[100vw] max-w-[1200px] max-h-[95vh] overflow-y-auto rounded-xl shadow-lg">
        {/* Header */}
        <div className="sticky top-0 bg-indigo-600 text-white px-6 py-3 rounded-t-xl flex justify-between items-center">
          <h2 className="text-lg font-semibold">Detach/Attach Memo or DO</h2>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/40 text-white rounded-full px-3 py-1 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-4">
            <button
              className={`px-4 py-2 rounded-md ${
                activeTab === "memo"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200"
              }`}
              onClick={() => setActiveTab("memo")}
            >
              Memo
            </button>
          </div>

          {/* Accordion for Detach and Attach */}
          <div className="space-y-4">
            {/* Detach Memo Section */}
            {activeTab === "memo" && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <button
                  className="flex justify-between w-full text-left"
                  onClick={() => toggleAccordion("detachMemo")}
                >
                  <h3 className="font-medium text-gray-700">Detach Memo</h3>
                  <span>{openAccordion === "detachMemo" ? "−" : "+"}</span>
                </button>
                {openAccordion === "detachMemo" && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Memo ID to Detach
                    </label>
                    <select
                      value={selectedDetachMemo}
                      onChange={(e) => {
                        setSelectedDetachMemo(e.target.value);
                        const filteredPickings = transactionPickings.filter(
                          (tp) => tp.memo_id === e.target.value
                        );
                        setFilteredTransactionPickings(filteredPickings);
                      }}
                      className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a Memo ID</option>
                      {currentMemoIds.map((memoId) => (
                        <option key={memoId} value={memoId}>
                          {memoId}
                        </option>
                      ))}
                    </select>

                    {/* Transaction Pickings Card */}
                    {filteredTransactionPickings.length > 0 ? (
                      <div className="p-4 bg-white shadow-md rounded-lg mt-4">
                        <h3 className="font-medium text-gray-700 mb-3">
                          Transaction Pickings
                        </h3>
                        {filteredTransactionPickings.map((tp) => (
                          <div key={tp.id} className="border-b py-2">
                            <p className="text-sm text-gray-600">
                              Transaction ID:{" "}
                              <span className="font-semibold">{tp.id}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              DO ID:{" "}
                              <span className="font-semibold">{tp.do_id}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Memo ID:{" "}
                              <span className="font-semibold">
                                {tp.memo_id}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantity:{" "}
                              <span className="font-semibold">
                                {tp.quantity} {tp.uom}
                              </span>
                            </p>
                            <p className="text-sm text-gray-600">
                              Status:{" "}
                              <span className="font-semibold">{tp.status}</span>
                            </p>
                          </div>
                        ))}

                        <div className="mt-4 flex justify-end">
                          <button
                            className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white"
                            onClick={async () => {
                              if (!data?.id || !selectedDetachMemo) return;
                              await onDetachTransaction?.({
                                memoId: selectedDetachMemo,
                                doId: data.id,
                                transactionId: data.transaction_picking_id,
                              });
                            }}
                          >
                            Detach Transaction Picking
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-white shadow-md rounded-lg mt-4">
                        <p className="text-gray-500">
                          Belum Ada Transaction Picking
                        </p>
                      </div>
                    )}

                    {/* Buttons for Detach Options */}
                    <div className="mt-4 space-x-2">
                      <button
                        className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white"
                        onClick={async () => {
                          if (!data?.id || !selectedDetachMemo) return;

                          // Menampilkan pop-up konfirmasi
                          const result = await Swal.fire({
                            title: "Apakah Anda yakin?",
                            text: `Anda akan detach memo_id ${selectedDetachMemo} dari DO ${data.id}`,
                            icon: "warning",
                            showCancelButton: true,
                            confirmButtonText: "Ya, detach!",
                            cancelButtonText: "Batal",
                          });

                          if (result.isConfirmed) {
                            await onDetachMemo?.({
                              memoId: selectedDetachMemo,
                              doId: data.id,
                            });
                          }
                        }}
                      >
                        Detach Memo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attach Memo Section */}
            {activeTab === "memo" && (
              <div className="bg-gray-100 p-4 rounded-lg">
                <button
                  className="flex justify-between w-full text-left"
                  onClick={() => toggleAccordion("attachMemo")}
                >
                  <h3 className="font-medium text-gray-700">Attach Memo</h3>
                  <span>{openAccordion === "attachMemo" ? "−" : "+"}</span>
                </button>
                {openAccordion === "attachMemo" && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Memo to Attach
                    </label>
                    <select
                      value={selectedAttachMemo}
                      onChange={(e) => {
                        const selectedMemoId = e.target.value;
                        setSelectedAttachMemo(selectedMemoId);

                        // Temukan detail memo berdasarkan ID yang dipilih
                        const selectedMemo = memoList.find(
                          (memo) => memo.id === selectedMemoId
                        );
                        setSelectedMemoDetails(selectedMemo); // Update state dengan detail memo
                      }}
                      className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a Memo</option>
                      {memoList.map((memo) => (
                        <option key={memo.id} value={memo.id}>
                          memo_number: {memo.outbound_memo_number}, memo_id:{" "}
                          {memo.id}
                          {/* Menampilkan nomor memo atau informasi lain yang relevan */}
                        </option>
                      ))}
                    </select>

                    {/* Card untuk menampilkan informasi detail memo yang dipilih */}
                    {selectedMemoDetails && (
                      <div className="mt-4 p-4 bg-white shadow-md rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-3">
                          Detail Memo
                        </h3>
                        <p className="text-sm text-gray-600">
                          Memo Number:{" "}
                          <span className="font-semibold">
                            {selectedMemoDetails.outbound_memo_number}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Requestor:{" "}
                          <span className="font-semibold">
                            {selectedMemoDetails.requestor}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Origin:{" "}
                          <span className="font-semibold">
                            {selectedMemoDetails.origin}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Ship To:{" "}
                          <span className="font-semibold">
                            {selectedMemoDetails.ship_to}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Destination:{" "}
                          <span className="font-semibold">
                            {selectedMemoDetails.destination}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Delivery Date:{" "}
                          <span className="font-semibold">
                            {new Date(
                              selectedMemoDetails.delivery_date
                            ).toLocaleDateString()}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Status:{" "}
                          <span className="font-semibold">
                            {selectedMemoDetails.status}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Notes:{" "}
                          <span className="font-semibold">
                            {selectedMemoDetails.notes}
                          </span>
                        </p>
                      </div>
                    )}

                    <button
                      className="mt-2 px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white"
                      onClick={async () => {
                        if (!data?.id || !selectedDetachMemo) return;

                        await onAttachMemo?.({
                          memoId: selectedDetachMemo,
                          doId: data.id,
                        });
                      }}
                    >
                      Attach Memo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetachAttachModal;
